// analyze-resume/index.ts
//
// Supabase Edge Function — AI Resume Analysis (Foundation)
//
// This version establishes the function structure and validates the request.
// AI integration (PDF download, text extraction, OpenAI call) will be added
// in subsequent commits.

// Bring in Deno's built-in type definitions.
// Note: If you get "Cannot find name 'Deno'", ensure the Deno VS Code extension
// is installed and enabled for the `supabase/functions` folder, or run `npm i -D @types/deno`.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-api-version, prefer, accept",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  try {
    // Handle CORS preflight.
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Reject non-POST methods.
    if (req.method !== "POST") {
      return json(
        { error: `Method not allowed. Expected POST, received ${req.method}.` },
        405
      );
    }

    // Parse the request body.
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body." }, 400);
    }

    // Validate required fields.
    const { analysisSnapshotId, storagePath } = body;

    if (!analysisSnapshotId || typeof analysisSnapshotId !== "string") {
      return json(
        { error: "Missing or invalid field: analysisSnapshotId (string required)." },
        400
      );
    }

    if (!storagePath || typeof storagePath !== "string") {
      return json(
        { error: "Missing or invalid field: storagePath (string required)." },
        400
      );
    }

    // Create Supabase client using the user's auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn("No Authorization header found in request.");
    }
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.");
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      { global: { headers: { Authorization: authHeader ?? "" } } }
    );

    const startTime = Date.now();

    // Update snapshot from 'pending' to 'processing'
    const { error: updateError } = await supabaseClient
      .from("analysis_snapshots")
      .update({ status: "processing" })
      .eq("id", analysisSnapshotId);

    if (updateError) {
      console.error(updateError);
      return json(
        { 
          error: updateError.message,
          code: updateError.code
        }, 
        500
      );
    }

    // Foundation response — AI pipeline will be wired here in the next commit.
    return json({
      success: true,
      processingTimeMs: Date.now() - startTime,
    });
  } catch (err) {
    console.error("Unhandled exception in Edge Function:", err);
    return json({ 
      error: "Internal Server Error", 
      details: err instanceof Error ? err.message : String(err)
    }, 500);
  }
});
