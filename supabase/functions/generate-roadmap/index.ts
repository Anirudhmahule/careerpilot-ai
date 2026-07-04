import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "zod";
import { taxonomyService } from "../../../src/features/taxonomy/services/taxonomy.service.ts";
import { gapService } from "../../../src/features/gaps/services/gap.service.ts";
import { buildRoadmapPlan } from "../../../src/features/roadmap/engine/roadmap-planner.ts";
import { roadmapPlanSchema } from "../../../src/features/roadmap/schemas/roadmap.schema.ts";
import { fingerprintRoleRequirements, ROLE_REQUIREMENTS_FINGERPRINT_VERSION } from "../../../src/features/roadmap/utils/role-requirements-fingerprint.ts";
import type { ResumeAnalysisLike } from "../../../src/features/taxonomy/types/taxonomy.types.ts";

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

const GenerateRoadmapRequestSchema = z.object({
  journeyId: z.string().uuid("Invalid journeyId"),
  analysisSnapshotId: z.string().uuid("Invalid analysisSnapshotId"),
  roleId: z.string().uuid("Invalid roleId"),
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

    const parseResult = GenerateRoadmapRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return json({ error: "Validation failed", details: parseResult.error.format() }, 400);
    }
    const { journeyId, analysisSnapshotId, roleId } = parseResult.data;

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

    // 3. Verify Journey Ownership
    const { data: journey, error: journeyError } = await serviceClient
      .from("journeys")
      .select("id, user_id")
      .eq("id", journeyId)
      .single();

    if (journeyError || !journey) {
      return json({ error: "Journey not found or access denied." }, 404);
    }
    if (journey.user_id !== userId) {
      return json({ error: "Forbidden: Journey ownership mismatch." }, 403);
    }

    // 4. Verify Analysis Snapshot Ownership
    const { data: snapshotData, error: snapshotError } = await serviceClient
      .from("analysis_snapshots")
      .select(`
        id,
        raw_response,
        status,
        resume_version_id
      `)
      .eq("id", analysisSnapshotId)
      .single();

    if (snapshotError || !snapshotData) {
      return json({ error: "Analysis snapshot not found." }, 404);
    }
    if (snapshotData.status !== "completed" || !snapshotData.raw_response) {
      return json({ error: "Analysis snapshot is not completed or missing data." }, 400);
    }

    // Load resume version to prove ownership path: analysis_snapshot -> resume_version -> user_id
    const { data: resumeVersion, error: resumeVersionError } = await serviceClient
      .from("resume_versions")
      .select("user_id, journey_id")
      .eq("id", snapshotData.resume_version_id)
      .single();

    if (resumeVersionError || !resumeVersion) {
      return json({ error: "Cannot verify snapshot ownership: associated resume version not found." }, 404);
    }
    if (resumeVersion.user_id !== userId) {
      return json({ error: "Forbidden: Snapshot ownership mismatch." }, 403);
    }
    if (resumeVersion.journey_id !== journeyId) {
      return json({ error: "Conflict: Snapshot belongs to a different journey." }, 409);
    }

    const rawResponse = snapshotData.raw_response as any;
    if (!rawResponse || !rawResponse.analysis) {
      return json({ error: "Malformed analysis snapshot data." }, 500);
    }
    const resumeAnalysis = rawResponse.analysis as ResumeAnalysisLike;

    // 5. Load Authoritative Role Data
    const { data: roleData, error: roleError } = await serviceClient
      .from("roles")
      .select("id, name, slug")
      .eq("id", roleId)
      .single();

    if (roleError || !roleData) {
      return json({ error: "Role not found." }, 404);
    }

    const { data: reqData, error: reqError } = await serviceClient
      .from("role_skill_requirements")
      .select("skill_id, importance, skills(canonical_name, slug)")
      .eq("role_id", roleId);

    if (reqError) {
      return json({ error: "Failed to load role requirements." }, 500);
    }
    if (!reqData || reqData.length === 0) {
      return json({ error: "Role has no requirements configured." }, 400);
    }

    const requirements = reqData.map((r: any) => ({
      skillId: r.skill_id,
      skillSlug: r.skills.slug,
      canonicalName: r.skills.canonical_name,
      importance: r.importance
    }));

    // 6. Build Authoritative Gap Input
    const occurrences = taxonomyService.aggregateEvidenceOccurrences(resumeAnalysis);
    
    // Resolve occurrences via taxonomy service WITH authClient (or serviceClient)
    // We use serviceClient here because it securely fetches the aliases without needing to pass auth token.
    const resolvedResult = await taxonomyService.resolveEvidenceOccurrences(occurrences, serviceClient);
    if (resolvedResult.error || !resolvedResult.data) {
      return json({ error: "Failed to resolve taxonomy evidence.", details: resolvedResult.error }, 500);
    }
    const resolvedOccurrences = resolvedResult.data;

    // Run matching
    const matchResult = taxonomyService.matchRoleRequirements(
      roleData.id,
      roleData.name,
      roleData.slug,
      requirements,
      resolvedOccurrences,
      []
    );

    // Calculate gaps
    const gapResult = gapService.calculateGaps(matchResult);

    // 7. Generation Metadata & Planner Execution
    const generatedAt = new Date().toISOString();
    const strategy = "deterministic-v1";
    
    const plan = buildRoadmapPlan({
      targetRole: {
        roleId: roleData.id,
        roleSlug: roleData.slug,
        roleName: roleData.name
      },
      gapResult,
      roleRequirements: requirements,
      generatedAt,
      strategy
    });

    // Plan Validation
    const planValidationResult = roadmapPlanSchema.safeParse(plan);
    if (!planValidationResult.success) {
      return json({ error: "Generated plan failed schema validation.", details: planValidationResult.error.format() }, 500);
    }

    // Prepare fingerprint
    const fingerprintInput = requirements.map(r => ({
      skillId: r.skillId,
      importance: r.importance
    }));
    const fingerprint = await fingerprintRoleRequirements(fingerprintInput);

    // 8. Persist Immutable Version
    const { data: insertedVersion, error: insertError } = await serviceClient
      .from("roadmap_versions")
      .insert({
        user_id: userId,
        journey_id: journeyId,
        analysis_snapshot_id: analysisSnapshotId,
        role_id: roleId,
        role_slug: roleData.slug,
        generation_strategy: "hybrid-v1", // DB constraint
        prompt_version: "deterministic-v1", // Truthful non-AI marker
        model: "none", // Truthful non-AI marker
        role_requirements_fingerprint: fingerprint,
        role_requirements_fingerprint_version: ROLE_REQUIREMENTS_FINGERPRINT_VERSION,
        plan_data: plan as any
      })
      .select("*")
      .single();

    if (insertError || !insertedVersion) {
      return json({ error: "Failed to persist roadmap version.", details: insertError }, 500);
    }

    // 9. Switch Active Pointer
    const { error: activeError } = await serviceClient
      .from("roadmap_active_versions")
      .upsert({
        journey_id: journeyId,
        roadmap_version_id: insertedVersion.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: "journey_id"
      });

    if (activeError) {
      return json({ 
        error: "Roadmap version created but failed to switch active pointer.",
        versionId: insertedVersion.id,
        details: activeError 
      }, 500);
    }

    return json({
      message: "Roadmap generated successfully.",
      versionId: insertedVersion.id,
      plan
    });

  } catch (err) {
    return json({ error: "Internal Server Error", details: err instanceof Error ? err.message : String(err) }, 500);
  }
});
