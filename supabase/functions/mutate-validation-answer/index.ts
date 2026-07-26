import { createClient } from "npm:@supabase/supabase-js@2";
import { MutateValidationAnswerRequestSchema } from "../../../src/features/validation/types/validation.types.ts";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed. Expected POST." }, 405);
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400);
    }

    const parseResult = MutateValidationAnswerRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return json({ error: "Validation failed", details: parseResult.error.format() }, 400);
    }
    const payload = parseResult.data;

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

    // 3. Verify Question Ownership and Input Type Compatibility
    const { data: questionData, error: questionError } = await serviceClient
      .from("validation_questions")
      .select(`
        id,
        input_type,
        generation_id,
        validation_generations!inner (
          status,
          analysis_snapshot_id,
          analysis_snapshots!inner (
            resume_version_id,
            resume_versions!inner (
              user_id
            )
          )
        )
      `)
      .eq("id", payload.questionId)
      .maybeSingle();

    if (questionError) {
      return json({ error: "Failed to resolve question ownership." }, 500);
    }
    
    if (!questionData) {
      return json({ error: "Question not found." }, 404);
    }

    // Ownership check traversing the relationships (typed as any to handle Postgrest nested joins safely)
    const ownerId = (questionData as any).validation_generations?.analysis_snapshots?.resume_versions?.user_id;
    
    if (ownerId !== userId) {
      return json({ error: "Forbidden: Question ownership mismatch." }, 403);
    }

    const generationStatus = (questionData as any).validation_generations?.status;
    if (generationStatus !== 'completed') {
      return json({ error: "Validation generation is not completed." }, 409);
    }

    // Type compatibility check
    if (questionData.input_type !== payload.answer.type) {
      return json({ error: `Input type mismatch. Question requires ${questionData.input_type}` }, 400);
    }

    // If SINGLE_CHOICE, verify option membership
    if (payload.answer.type === "SINGLE_CHOICE") {
      const { data: optionData, error: optionError } = await serviceClient
        .from("validation_question_options")
        .select("id")
        .eq("question_id", payload.questionId)
        .eq("id", payload.answer.optionId)
        .maybeSingle();

      if (optionError || !optionData) {
        return json({ error: "Invalid optionId for this question." }, 400);
      }
    }

    // 4. Construct upsert payload
    const now = new Date().toISOString();
    
    const upsertPayload = {
      question_id: payload.questionId,
      user_id: userId,
      boolean_value: payload.answer.type === "BOOLEAN" ? payload.answer.value : null,
      selected_option_id: payload.answer.type === "SINGLE_CHOICE" ? payload.answer.optionId : null,
      text_value: payload.answer.type === "TEXT" ? payload.answer.value : null,
      updated_at: now
      // created_at is omitted to preserve original if it exists
    };

    // 5. Upsert Mutation (Uses PRIMARY KEY question_id, user_id)
    const { error: upsertError } = await serviceClient
      .from("validation_answers")
      .upsert(upsertPayload, {
        onConflict: "question_id,user_id",
        ignoreDuplicates: false,
      });

    if (upsertError) {
      // Return safe structured error
      return json({ error: "Failed to persist validation answer." }, 500);
    }

    return json({ success: true, updated_at: now });

  } catch (err: unknown) {
    return json({ error: "Internal server error." }, 500); // Strip detail leaks entirely
  }
});
