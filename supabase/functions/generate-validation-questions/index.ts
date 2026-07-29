import { createClient } from "npm:@supabase/supabase-js@2";
import {
  GenerateValidationQuestionsRequestSchema,
  ValidationGenerationOutputSchema,
  ValidationCandidate
} from "../../../src/features/validation/types/validation.types.ts";
import { parseSnapshotRawResponse } from "../../../src/lib/resume-analysis.schema.ts";
import { taxonomyService } from "../../../src/features/taxonomy/services/taxonomy.service.ts";

// ── Allowed model identifiers (server-owned, no client input) ──────────────────
type AllowedValidationModel = "gemini-3.5-flash" | "gemini-3.1-flash-lite";

const PRIMARY_MODEL: AllowedValidationModel = "gemini-3.5-flash";
const FALLBACK_MODEL: AllowedValidationModel = "gemini-3.1-flash-lite";

const VALIDATION_MODELS: ReadonlyArray<{ model: AllowedValidationModel; phase: "primary" | "fallback" }> = [
  { model: PRIMARY_MODEL, phase: "primary" },
  { model: FALLBACK_MODEL, phase: "fallback" },
] as const;

// ── Provider error ─────────────────────────────────────────────────────────────
class GeminiProviderError extends Error {
  status: number;
  retryable: boolean;
  constructor(message: string, status: number) {
    super(message);
    this.name = "GeminiProviderError";
    this.status = status;
    this.retryable = [429, 500, 502, 503, 504].includes(status);
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

function gvqTrace(stage: string, event: "enter" | "success" | "failure" | "return_500", err?: any): void {
  const payload: Record<string, unknown> = { marker: "GVQ_TRACE", stage, event };
  if (err !== undefined && err !== null) {
    if (err instanceof Error) {
      payload.errorName = err.name;
      payload.errorMessage = err.message;
    } else if (typeof err === "object") {
      if ("name" in err) payload.errorName = String(err.name);
      if ("message" in err) payload.errorMessage = String(err.message);
      if ("code" in err) payload.supabaseCode = String(err.code);
      if ("status" in err) payload.httpStatus = String(err.status);
    } else {
      payload.errorMessage = String(err);
    }
  }
  console.log(payload);
}

// ── Gemini structured-output schema (wording-only: candidateId + questionText) ──
// Matches ValidationGenerationOutputSchema contract.
const GEMINI_WORDING_SCHEMA = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          candidateId: { type: "STRING" },
          questionText: { type: "STRING" },
        },
        required: ["candidateId", "questionText"],
      },
    },
  },
  required: ["questions"],
};

// ── callGeminiForWording: model-explicit, no global URL ────────────────────────
async function callGeminiForWording(
  apiKey: string,
  model: AllowedValidationModel,
  candidates: { candidateId: string; context: string }[]
): Promise<unknown> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const userContent = JSON.stringify(candidates);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{
          text: "You are a validation question generator for a career skills platform. " +
            "Given an array of candidate objects each with a candidateId and context, " +
            "return a JSON object with a 'questions' array. " +
            "Each element must have 'candidateId' (copy exactly from input) and 'questionText' (a concise yes/no or single-choice question). " +
            "Do NOT invent skillId, semanticType, sourceEntityId, scores, or any other fields. " +
            "Return exactly one entry per input candidate, preserving all candidateIds."
        }]
      },
      contents: [{ role: "user", parts: [{ text: userContent }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: GEMINI_WORDING_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let statusDetails = "";
    try {
      const parsed = JSON.parse(errorBody);
      statusDetails = parsed.error?.message || errorBody;
    } catch {
      statusDetails = errorBody;
    }
    throw new GeminiProviderError(`Gemini API error ${response.status}: ${statusDetails}`, response.status);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];

  if (!candidate) {
    const blockReason = data.promptFeedback?.blockReason;
    throw new Error(blockReason
      ? `Gemini request blocked. Reason: ${blockReason}`
      : "Gemini returned an empty candidates array."
    );
  }

  if (candidate.finishReason !== "STOP") {
    throw new Error(`Gemini did not complete normally. finishReason: ${candidate.finishReason}`);
  }

  const content = candidate.content?.parts?.[0]?.text;
  if (content === null || content === undefined) {
    throw new Error(`Gemini returned null content. finishReason: ${candidate.finishReason}`);
  }

  return JSON.parse(content);
}

const PROMPT_VERSION = "v2-validation-strict";
const SCHEMA_VERSION = "2.0.0";
const MAX_CANDIDATES = 10;
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PROVIDER_ATTEMPTS = 3;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed. Expected POST." }, 405);
  }

  let stage = "init";
  gvqTrace(stage, "enter");

  try {
    // ── parse_request ──────────────────────────────────────────────────────────
    stage = "parse_request";
    gvqTrace(stage, "enter");

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400);
    }

    const parseResult = GenerateValidationQuestionsRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return json({ error: "Validation failed" }, 400);
    }
    const { analysisSnapshotId, roleId } = parseResult.data;

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      gvqTrace(stage, "return_500");
      return json({ error: "Internal server error" }, 500);
    }

    // ── auth_user ──────────────────────────────────────────────────────────────
    stage = "auth_user";
    gvqTrace(stage, "enter");

    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader ?? "" } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = user.id;

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ── verify_snapshot ────────────────────────────────────────────────────────
    stage = "verify_snapshot";
    gvqTrace(stage, "enter");

    const { data: snapshotData, error: snapshotError } = await serviceClient
      .from("analysis_snapshots")
      .select("id, raw_response, resume_versions!inner(user_id)")
      .eq("id", analysisSnapshotId)
      .single();

    if (snapshotError || !snapshotData) {
      gvqTrace(stage, "return_500", snapshotError);
      return json({ error: "Snapshot not found or inaccessible." }, 404);
    }

    // ── verify_role ────────────────────────────────────────────────────────────
    stage = "verify_role";
    gvqTrace(stage, "enter");

    const snapshotOwner = (snapshotData as any).resume_versions?.user_id;
    if (snapshotOwner !== userId) {
      return json({ error: "Forbidden" }, 403);
    }

    const { data: roleData, error: roleError } = await serviceClient
      .from("roles")
      .select("id, name, slug")
      .eq("id", roleId)
      .single();

    if (roleError || !roleData) {
      gvqTrace(stage, "return_500", roleError);
      return json({ error: "Role not found." }, 404);
    }

    // ── claim_rpc ──────────────────────────────────────────────────────────────
    stage = "claim_rpc";
    gvqTrace(stage, "enter");

    const { data: claimData, error: claimError } = await serviceClient
      .rpc("claim_validation_generation_attempt", {
        p_analysis_snapshot_id: analysisSnapshotId,
        p_role_id: roleId,
        p_prompt_version: PROMPT_VERSION,
        p_schema_version: SCHEMA_VERSION,
        p_model: PRIMARY_MODEL,
        p_stale_threshold_ms: STALE_THRESHOLD_MS
      });

    if (claimError || !claimData) {
      gvqTrace(stage, "return_500", claimError);
      return json({ error: "Failed to securely claim generation attempt." }, 500);
    }

    const { status: claimStatus, generationId } = claimData as any;

    if (claimStatus === "completed") {
      return json({ status: "completed", generationId });
    }
    if (claimStatus === "pending") {
      return json({ status: "pending", generationId });
    }

    // Status is 'claimed' — proceed to generate
    const pendingGenerationId = generationId;

    // ── parse_canonical ────────────────────────────────────────────────────────
    stage = "parse_canonical";
    gvqTrace(stage, "enter");

    let parsedAnalysis;
    try {
      const parsedResult = parseSnapshotRawResponse(snapshotData.raw_response);
      if (!parsedResult.success) {
        throw new Error("Canonical parsing failed");
      }
      parsedAnalysis = parsedResult.data;
    } catch (err: any) {
      gvqTrace(stage, "return_500", err);
      await serviceClient
        .from("validation_generations")
        .update({ status: "failed", error_message: "Parse error" })
        .eq("id", pendingGenerationId);
      return json({ error: "Internal processing error." }, 500);
    }

    // ── derive_candidates ──────────────────────────────────────────────────────
    stage = "derive_candidates";
    gvqTrace(stage, "enter");

    let candidates: ValidationCandidate[] = [];
    try {
      stage = "aggregate_evidence";
      gvqTrace(stage, "enter");
      const occurrences = taxonomyService.aggregateEvidenceOccurrences(parsedAnalysis);

      stage = "resolve_evidence";
      gvqTrace(stage, "enter");
      const resolvedOccurrencesResult = await taxonomyService.resolveEvidenceOccurrences(occurrences, serviceClient);
      if (resolvedOccurrencesResult.error || !resolvedOccurrencesResult.data) {
        throw new Error("Taxonomy resolution failed");
      }

      stage = "get_role_requirements";
      gvqTrace(stage, "enter");
      const roleReqResult = await taxonomyService.getRoleRequirements(roleData.slug as any, serviceClient);
      if (roleReqResult.error || !roleReqResult.data) {
        throw new Error("Role requirements failed");
      }

      stage = "match_role_requirements";
      gvqTrace(stage, "enter");
      const matchResult = taxonomyService.matchRoleRequirements(
        roleData.id,
        roleData.name,
        roleData.slug,
        roleReqResult.data.requirements,
        resolvedOccurrencesResult.data
      );

      // A. Missing Skills → DISCOVER_MISSING_SKILL
      for (const missing of matchResult.missing) {
        candidates.push({
          candidateId: crypto.randomUUID(),
          semanticType: "DISCOVER_MISSING_SKILL",
          inputType: "BOOLEAN",
          skillId: missing.skillId,
          skillCanonicalName: missing.canonicalName
        });
      }

      // B. Contextual-only Matched Skills → CONFIRM_CONTEXTUAL_SKILL
      for (const matched of matchResult.matched) {
        const hasExact = matched.occurrences.some(e => e.evidenceKind === "exact");
        if (!hasExact && matched.occurrences.length > 0) {
          const ev = matched.occurrences[0];
          if (ev.sourceEntityId) {
            candidates.push({
              candidateId: crypto.randomUUID(),
              semanticType: "CONFIRM_CONTEXTUAL_SKILL",
              inputType: "BOOLEAN",
              skillId: matched.skillId,
              skillCanonicalName: matched.canonicalName,
              sourceEntityId: ev.sourceEntityId,
              evidenceText: ev.evidence[0] || ""
            });
          }
        }
      }

      // Deterministic sort: Semantic Type → Canonical Name → SourceEntityId
      candidates.sort((a, b) => {
        if (a.semanticType !== b.semanticType) return a.semanticType.localeCompare(b.semanticType);
        const aName = (a.semanticType === "DISCOVER_MISSING_SKILL" || a.semanticType === "CONFIRM_CONTEXTUAL_SKILL") ? a.skillCanonicalName : "";
        const bName = (b.semanticType === "DISCOVER_MISSING_SKILL" || b.semanticType === "CONFIRM_CONTEXTUAL_SKILL") ? b.skillCanonicalName : "";
        if (aName !== bName) return aName.localeCompare(bName);
        const aSource = (a.semanticType === "CONFIRM_CONTEXTUAL_SKILL" || a.semanticType === "CLARIFY_DEPTH") ? a.sourceEntityId : "";
        const bSource = (b.semanticType === "CONFIRM_CONTEXTUAL_SKILL" || b.semanticType === "CLARIFY_DEPTH") ? b.sourceEntityId : "";
        return (aSource || "").localeCompare(bSource || "");
      });

      if (candidates.length > MAX_CANDIDATES) {
        candidates = candidates.slice(0, MAX_CANDIDATES);
      }

    } catch (err: any) {
      gvqTrace("derive_candidates", "return_500", err);
      await serviceClient
        .from("validation_generations")
        .update({ status: "failed", error_message: "Candidate derivation error" })
        .eq("id", pendingGenerationId);
      return json({ error: "Internal processing error." }, 500);
    }

    // ── finalize_rpc_fast_path (no candidates) ─────────────────────────────────
    if (candidates.length === 0) {
      stage = "finalize_rpc_fast_path";
      gvqTrace(stage, "enter");

      const { data: finalizeData, error: finalizeError } = await serviceClient
        .rpc("finalize_validation_generation", { p_generation_id: pendingGenerationId, p_model: null });

      if (finalizeError || !finalizeData) {
        gvqTrace(stage, "return_500", finalizeError);
        await serviceClient
          .from("validation_generations")
          .update({ status: "failed", error_message: "RPC finalize failed (fast path)" })
          .eq("id", pendingGenerationId);
        return json({ error: "Internal DB error" }, 500);
      }
      return json({ status: "completed", generationId: pendingGenerationId });
    }

    // ── llm_generation (Gemini provider plan) ─────────────────────────────────
    stage = "llm_generation";
    gvqTrace(stage, "enter");

    let aiOutput: unknown = null;
    // Tracks the actual model that produced a successful provider response.
    // Set ONLY after callGeminiForWording returns without throwing.
    let successfulModel: AllowedValidationModel | null = null;

    // Build a safe, non-PII prompt input: only candidateId + context string
    const aiPromptInput = candidates.map(c => {
      if (c.semanticType === "DISCOVER_MISSING_SKILL") {
        return { candidateId: c.candidateId, context: `Ask if the user has experience with ${c.skillCanonicalName}.` };
      } else if (c.semanticType === "CONFIRM_CONTEXTUAL_SKILL") {
        return { candidateId: c.candidateId, context: `Ask if the user personally utilized ${c.skillCanonicalName} in the context of: "${c.evidenceText}".` };
      }
      return { candidateId: c.candidateId, context: "" };
    });

    if (geminiApiKey) {
      // ── per-model provider loop ──────────────────────────────────────────────
      let primaryExhausted = false;

      for (const { model, phase } of VALIDATION_MODELS) {
        // Only proceed to fallback if primary was exhausted by transient errors.
        if (phase === "fallback" && !primaryExhausted) break;

        if (phase === "fallback") {
          console.log({
            marker: "GVQ_TRACE",
            stage: "llm_generation",
            event: "provider_fallback_start",
            providerModel: FALLBACK_MODEL,
            providerPhase: "fallback",
          });
        }

        let attempt = 0;
        let modelExhausted = false;
        let nonRetryableFailure = false;

        while (attempt < MAX_PROVIDER_ATTEMPTS) {
          attempt++;
          console.log({
            marker: "GVQ_TRACE",
            stage: "llm_generation",
            event: attempt === 1 ? "provider_attempt" : "provider_retry",
            providerPhase: phase,
            providerModel: model,
            providerAttempt: attempt,
          });

          try {
            aiOutput = await callGeminiForWording(geminiApiKey, model, aiPromptInput);
            // Provider call succeeded — record which model succeeded
            successfulModel = model;
            console.log({
              marker: "GVQ_TRACE",
              stage: "llm_generation",
              event: "provider_success",
              providerPhase: phase,
              providerModel: model,
              providerAttempt: attempt,
            });
            break; // Exit per-model retry loop
          } catch (err: any) {
            const isRetryable = err instanceof GeminiProviderError && err.retryable;
            const providerStatus = err instanceof GeminiProviderError ? err.status : undefined;

            if (isRetryable && attempt < MAX_PROVIDER_ATTEMPTS) {
              // Transient — wait and retry same model
              const baseDelay = attempt === 1 ? 500 : 1000;
              const jitter = Math.random() * 200;
              await sleep(baseDelay + jitter);
              continue;
            }

            if (isRetryable) {
              // This model's retries exhausted
              modelExhausted = true;
              console.log({
                marker: "GVQ_TRACE",
                stage: "llm_generation",
                event: "provider_model_exhausted",
                providerPhase: phase,
                providerModel: model,
                providerAttempt: attempt,
                providerStatus,
              });
              break;
            } else {
              // Non-retryable (e.g. 400, 401, malformed JSON, blocked candidate)
              nonRetryableFailure = true;
              gvqTrace("llm_generation", "return_500", err);
              await serviceClient
                .from("validation_generations")
                .update({ status: "failed", error_message: "LLM error" })
                .eq("id", pendingGenerationId);
              return json({ error: "Internal generation error" }, 500);
            }
          }
        }

        if (nonRetryableFailure) break; // Already returned above, but guard

        if (successfulModel !== null) break; // Success — stop iterating models

        // Model exhausted by transient errors
        if (phase === "primary" && modelExhausted) {
          primaryExhausted = true;
          // Do NOT mark DB failed here — fallback may succeed
          continue; // Move to fallback model
        }

        if (phase === "fallback" && modelExhausted) {
          // Total provider plan exhausted
          console.log({
            marker: "GVQ_TRACE",
            stage: "llm_generation",
            event: "provider_exhausted",
            providerPhase: "fallback",
            providerModel: model,
          });
          await serviceClient
            .from("validation_generations")
            .update({ status: "failed", error_message: "AI provider temporarily unavailable" })
            .eq("id", pendingGenerationId);
          return json({ error: "AI provider temporarily unavailable." }, 503);
        }
      }
    } else {
      // No key configured: generate safe deterministic mock output (dev only)
      aiOutput = {
        questions: candidates.map(c => ({
          candidateId: c.candidateId,
          questionText: (c.semanticType === "DISCOVER_MISSING_SKILL" || c.semanticType === "CONFIRM_CONTEXTUAL_SKILL")
            ? `Do you have experience with ${c.skillCanonicalName}?`
            : `Can you clarify your experience level?`
        }))
      };
      // No actual AI model used in dev mock path
      successfulModel = null;
    }

    // ── validate_llm_output ────────────────────────────────────────────────────
    stage = "validate_llm_output";
    gvqTrace(stage, "enter");

    const outputValidation = ValidationGenerationOutputSchema.safeParse(aiOutput);
    if (!outputValidation.success) {
      gvqTrace(stage, "return_500");
      await serviceClient
        .from("validation_generations")
        .update({ status: "failed", error_message: "LLM output structural mismatch" })
        .eq("id", pendingGenerationId);
      return json({ error: "Generation output validation failed" }, 500);
    }
    const validatedAIQuestions = outputValidation.data.questions;

    // ── bind_candidates ────────────────────────────────────────────────────────
    stage = "bind_candidates";
    gvqTrace(stage, "enter");

    const aiCandidateMap = new Map<string, string>();
    for (const q of validatedAIQuestions) {
      if (aiCandidateMap.has(q.candidateId)) {
        gvqTrace(stage, "return_500");
        await serviceClient
          .from("validation_generations")
          .update({ status: "failed", error_message: "LLM returned duplicate candidate IDs" })
          .eq("id", pendingGenerationId);
        return json({ error: "Internal generation error" }, 500);
      }
      aiCandidateMap.set(q.candidateId, q.questionText);
    }

    if (aiCandidateMap.size !== candidates.length) {
      gvqTrace(stage, "return_500");
      await serviceClient
        .from("validation_generations")
        .update({ status: "failed", error_message: "LLM omitted or added candidate IDs" })
        .eq("id", pendingGenerationId);
      return json({ error: "Internal generation error" }, 500);
    }

    for (const c of candidates) {
      if (!aiCandidateMap.has(c.candidateId)) {
        gvqTrace(stage, "return_500");
        await serviceClient
          .from("validation_generations")
          .update({ status: "failed", error_message: "LLM candidate ID mismatch" })
          .eq("id", pendingGenerationId);
        return json({ error: "Internal generation error" }, 500);
      }
    }

    // ── successfulModel guard before materialization ───────────────────────────
    // If geminiApiKey was present but successfulModel is somehow null at this
    // point, an internal logic error has occurred. Fail safely.
    if (geminiApiKey && successfulModel === null) {
      gvqTrace("llm_generation", "return_500");
      await serviceClient
        .from("validation_generations")
        .update({ status: "failed", error_message: "Internal: successful model not tracked" })
        .eq("id", pendingGenerationId);
      return json({ error: "Internal generation error" }, 500);
    }

    // ── materialize_questions ──────────────────────────────────────────────────
    stage = "materialize_questions";
    gvqTrace(stage, "enter");

    try {
      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        const questionText = aiCandidateMap.get(c.candidateId);

        const { error: qError } = await serviceClient.from("validation_questions").insert({
          generation_id: pendingGenerationId,
          semantic_type: c.semanticType,
          input_type: c.inputType,
          skill_id: (c.semanticType === "DISCOVER_MISSING_SKILL" || c.semanticType === "CONFIRM_CONTEXTUAL_SKILL") ? c.skillId : null,
          source_entity_id: (c.semanticType === "CONFIRM_CONTEXTUAL_SKILL" || c.semanticType === "CLARIFY_DEPTH") ? c.sourceEntityId : null,
          question_text: questionText,
          order_index: i
        });

        if (qError) throw new Error("Question insert failed");
      }

      // ── finalize_rpc ─────────────────────────────────────────────────────────
      stage = "finalize_rpc";
      gvqTrace(stage, "enter");

      const { data: finalizeData, error: finalizeError } = await serviceClient
        .rpc("finalize_validation_generation", {
          p_generation_id: pendingGenerationId,
          p_model: successfulModel  // null only in no-key dev path; actual model otherwise
        });

      if (finalizeError || !finalizeData) {
        throw new Error("RPC finalization failed");
      }

      const finalStatus = (finalizeData as any).status;
      if (finalStatus === "superseded") {
        return json({ error: "Generation was superseded by a newer attempt." }, 409);
      }
      if (finalStatus === "invalid_model") {
        // Internal contract mismatch — model accepted by Edge plan but not DB
        gvqTrace("finalize_rpc", "return_500");
        // Generation row is still pending; mark it failed since we cannot complete it
        await serviceClient
          .from("validation_generations")
          .update({ status: "failed", error_message: "Internal model contract mismatch" })
          .eq("id", pendingGenerationId);
        return json({ error: "Internal server error." }, 500);
      }
      if (finalStatus === "not_found" || finalStatus === "invalid_state") {
        throw new Error(`Unexpected finalize status: ${finalStatus}`);
      }
      if (finalStatus !== "finalized") {
        throw new Error("Invalid RPC finalization state");
      }

    } catch (err: any) {
      stage = "failure_state_update";
      gvqTrace(stage, "enter");
      if (err.message !== "Superseded by newer attempt") {
        await serviceClient
          .from("validation_generations")
          .update({ status: "failed", error_message: "DB Materialization failed" })
          .eq("id", pendingGenerationId);
      }
      gvqTrace(stage, "return_500", err);
      return json({ error: "Internal DB error" }, 500);
    }

    gvqTrace(stage, "success");
    return json({ status: "completed", generationId: pendingGenerationId });

  } catch (err: any) {
    gvqTrace(stage, "return_500", err);
    return json({ error: "Internal server error." }, 500);
  }
});
