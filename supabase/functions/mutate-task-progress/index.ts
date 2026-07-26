import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "zod";
import { roadmapPlanSchema } from "../../../src/features/roadmap/schemas/roadmap.schema.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-api-version, prefer, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

const MutateTaskProgressRequestSchema = z.object({
  roadmapVersionId: z.string().uuid("Invalid roadmapVersionId"),
  taskId: z.string().uuid("Invalid taskId"),
  status: z.enum(["PENDING", "DONE", "SKIPPED"]),
  userNotes: z.string().max(2000, "Notes too long").nullable().optional()
});

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: `Method not allowed. Expected POST.` }, 405);
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400);
    }

    const parseResult = MutateTaskProgressRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return json({ error: "Validation failed", details: parseResult.error.format() }, 400);
    }
    const { roadmapVersionId, taskId, status, userNotes } = parseResult.data;

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing environment variables.");
    }

    // 1. Authenticate user via anon client passing their token
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader ?? "" } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = user.id;

    // 2. Initialize Service Role Client for authoritative operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 3. Verify Roadmap Ownership and Load Plan Data
    const { data: roadmapVersion, error: versionError } = await serviceClient
      .from("roadmap_versions")
      .select("user_id, plan_data")
      .eq("id", roadmapVersionId)
      .single();

    if (versionError || !roadmapVersion) {
      return json({ error: "Roadmap version not found or access denied." }, 404);
    }
    
    if (roadmapVersion.user_id !== userId) {
      return json({ error: "Forbidden: Roadmap ownership mismatch." }, 403);
    }

    // 4. Validate Immutable Plan Data
    const planValidation = roadmapPlanSchema.safeParse(roadmapVersion.plan_data);
    if (!planValidation.success) {
      return json({ error: "Data Integrity Error: Persisted plan_data is malformed." }, 500);
    }
    const plan = planValidation.data;

    // 5. Enforce Task Membership & Detect Duplicates
    const allTasks = plan.phases.flatMap(phase => phase.tasks);
    const matchingTasks = allTasks.filter(t => t.id === taskId);
    
    if (matchingTasks.length === 0) {
      return json({ error: "Task not found in the specified roadmap version." }, 404);
    }
    
    if (matchingTasks.length > 1) {
      return json({ error: "Data Integrity Error: Ambiguous duplicate task IDs exist in plan." }, 500);
    }

    // 6. Fetch Existing Progress (to preserve timestamps appropriately)
    const { data: existingProgress, error: fetchError } = await serviceClient
      .from("roadmap_task_progress")
      .select("status, completed_at, skipped_at, user_notes")
      .eq("roadmap_version_id", roadmapVersionId)
      .eq("task_id", taskId)
      .maybeSingle();

    if (fetchError) {
      return json({ error: "Failed to read existing task progress." }, 500);
    }

    // 7. Define Status/Timestamp & Notes Semantics
    const now = new Date().toISOString();
    let finalCompletedAt: string | null = null;
    let finalSkippedAt: string | null = null;

    if (status === "DONE") {
      finalCompletedAt = (existingProgress && existingProgress.status === "DONE" && existingProgress.completed_at)
        ? existingProgress.completed_at
        : now;
    } else if (status === "SKIPPED") {
      finalSkippedAt = (existingProgress && existingProgress.status === "SKIPPED" && existingProgress.skipped_at)
        ? existingProgress.skipped_at
        : now;
    }

    let finalNotes = existingProgress?.user_notes ?? null;
    if (userNotes !== undefined) {
      finalNotes = userNotes; // Can be explicit null to clear
    }

    // 8. Upsert Mutation Strategy
    // Uses the unique (roadmap_version_id, task_id) constraint.
    const { data: upsertedProgress, error: upsertError } = await serviceClient
      .from("roadmap_task_progress")
      .upsert({
        user_id: userId,
        roadmap_version_id: roadmapVersionId,
        task_id: taskId,
        status: status,
        completed_at: finalCompletedAt,
        skipped_at: finalSkippedAt,
        user_notes: finalNotes,
        updated_at: now
      }, {
        onConflict: "roadmap_version_id,task_id"
      })
      .select("*")
      .single();

    if (upsertError || !upsertedProgress) {
      return json({ error: "Failed to mutate task progress.", details: upsertError }, 500);
    }

    return json({
      message: "Progress updated successfully.",
      progress: upsertedProgress
    });

  } catch (err) {
    return json({ error: "Internal Server Error", details: err instanceof Error ? err.message : String(err) }, 500);
  }
});
