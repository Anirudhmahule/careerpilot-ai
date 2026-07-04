/**
 * openai.provider.ts
 *
 * Implements AIProvider using the OpenAI Chat Completions API.
 *
 * STRUCTURED OUTPUTS:
 *   We use OpenAI's `response_format: { type: "json_schema" }` to enforce
 *   that the model's response exactly matches ResumeExtractionSchema.
 *   This eliminates an entire class of Zod validation failures caused by
 *   the model inventing fields, omitting required fields, or returning prose.
 *
 *   The JSON schema sent to the API is derived from ResumeExtractionSchema
 *   at module load via Zod 4's native `z.toJSONSchema`. This keeps the API
 *   contract and the Zod validation schema in sync automatically — one schema,
 *   three uses: z.infer (TypeScript), .parse (runtime), z.toJSONSchema (OpenAI).
 *
 * PROMPT SELECTION:
 *   The system prompt is chosen by promptVersion from RESUME_ANALYSIS_PROMPT.
 *   Currently only "v2" exists.
 */

import { z } from "npm:zod/v4"; // v4 sub-path required for z.toJSONSchema
import { AIProvider } from "./interfaces/ai.provider.interface.ts";
import { RESUME_ANALYSIS_PROMPT } from "../prompts/resume-analysis-v2.ts";
import { ResumeExtractionSchema } from "../validators/resume-extraction.schema.ts";

// Derive the JSON schema once at module load — not per request.
const EXTRACTION_JSON_SCHEMA = z.toJSONSchema(ResumeExtractionSchema, {
  reused: "inline", // inline all definitions so OpenAI sees a flat schema
});

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export class OpenAIProvider implements AIProvider {
  private readonly apiKey: string;

  constructor() {
    const key = Deno.env.get("OPENAI_API_KEY");
    if (!key) {
      throw new Error("Missing OPENAI_API_KEY environment variable.");
    }
    this.apiKey = key;
  }

  async analyzeResume(resumeText: string, promptVersion: string): Promise<string> {
    if (promptVersion !== RESUME_ANALYSIS_PROMPT.version) {
      throw new Error(
        `Unknown prompt version "${promptVersion}". Expected "${RESUME_ANALYSIS_PROMPT.version}".`
      );
    }

    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-2024-08-06", // minimum model version that supports Structured Outputs
        messages: [
          {
            role: "system",
            content: RESUME_ANALYSIS_PROMPT.system,
          },
          {
            role: "user",
            content: resumeText,
          },
        ],
        // Structured Outputs constrains successful model output to this schema.
        // Runtime Zod validation remains the final trust boundary.
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ResumeExtraction",
            strict: true,
            schema: EXTRACTION_JSON_SCHEMA,
          },
        },
        temperature: 0, // deterministic extraction — no creativity needed
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `OpenAI API error ${response.status}: ${errorBody}`
      );
    }

    const data = await response.json() as {
      choices: Array<{
        message: { content: string | null };
        finish_reason: string;
      }>;
    };

    const choice = data.choices?.[0];

    if (!choice) {
      throw new Error("OpenAI returned an empty choices array.");
    }

    // Reject any non-normal completion. For this extraction pipeline we
    // only trust a clean "stop" — anything else (length, content_filter,
    // tool_calls, etc.) means the output may be incomplete or absent.
    if (choice.finish_reason !== "stop") {
      throw new Error(
        `OpenAI did not complete normally. finish_reason: ${choice.finish_reason}`
      );
    }

    const content = choice.message?.content;

    if (content === null || content === undefined) {
      throw new Error(
        `OpenAI returned null content. finish_reason: ${choice.finish_reason}`
      );
    }

    return content;
  }
}
