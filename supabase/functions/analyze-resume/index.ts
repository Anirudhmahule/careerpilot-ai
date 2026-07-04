import { createClient } from "npm:@supabase/supabase-js@2";
import { AnalyzeResumeRequestSchema } from "./validators/request.schema.ts";
import { logger } from "./utils/logger.ts";
import { SupabaseSnapshotRepository } from "./repositories/snapshot.repository.ts";
import { SupabaseStorageProvider } from "./services/supabase-storage.provider.ts";
import { PdfParseExtractor } from "./services/pdf-parse.extractor.ts";
import { OpenAIProvider } from "./services/openai.provider.ts";
import { GeminiProvider } from "./services/gemini.provider.ts";
import { ResumeAnalysisOrchestrator } from "./services/resume-analysis.service.ts";
import { AnalyzeResumeCommand } from "./types/resume-analysis.types.ts";
import { ConflictError } from "./errors/conflict.error.ts";

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
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
      return json({ error: `Method not allowed. Expected POST, received ${req.method}.` }, 405);
    }

    // 1. Parse and Validate Request
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400);
    }

    const parseResult = AnalyzeResumeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      logger.warn("Validation failed", parseResult.error.format());
      return json({ error: "Validation failed", details: parseResult.error.format() }, 400);
    }
    const requestPayload = parseResult.data as AnalyzeResumeCommand;

    // 2. Initialize Supabase Client
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader ?? "" } }
    });

    // 3. Setup Dependencies (Dependency Injection)
    const snapshotRepository = new SupabaseSnapshotRepository(supabaseClient);
    const storageProvider = new SupabaseStorageProvider(supabaseClient);
    const pdfExtractor = new PdfParseExtractor();
    const aiProvider = new GeminiProvider();
    
    const resumeAnalysisOrchestrator = new ResumeAnalysisOrchestrator(
      logger,
      snapshotRepository,
      storageProvider,
      pdfExtractor,
      aiProvider
    );

    // 4. Execute Orchestrator
    const result = await resumeAnalysisOrchestrator.execute(requestPayload);

    // 5. Handle Result Monad
    if (result.type === "success") {
      return json(result.data);
    } else {
      const err = result.error;
      if (err instanceof ConflictError) {
        return json({ error: err.message }, 409);
      }
      return json({ error: err.message }, 500);
    }
    
  } catch (err) {
    logger.error("Unhandled exception in Edge Function:", err);
    return json({ 
      error: "Internal Server Error", 
      details: err instanceof Error ? err.message : String(err)
    }, 500);
  }
});
