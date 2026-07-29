/**
 * gemini.provider.ts
 *
 * Implements AIProvider using the Google Gemini REST API.
 */

import { z } from "npm:zod/v4";
import { AIProvider } from "./interfaces/ai.provider.interface.ts";
import { RESUME_ANALYSIS_PROMPT } from "../prompts/resume-analysis-v2.ts";
import { ResumeExtractionSchema } from "../validators/resume-extraction.schema.ts";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

/**
 * Adapt the JSON schema for Gemini.
 * Gemini's responseSchema expects strict OpenAPI 3.0 types (e.g., uppercase enum strings),
 * and does not support `additionalProperties` or `$schema`. 
 * It also rejects JSON Schema draft-07 array types like `["string", "null"]`,
 * requiring `type: "STRING", nullable: true` instead.
 */
function adaptSchemaForGemini(schema: any): any {
  if (typeof schema !== "object" || schema === null) return schema;
  
  if (Array.isArray(schema)) {
    return schema.map(adaptSchemaForGemini);
  }

  const result: any = {};
  for (const [key, value] of Object.entries(schema)) {
    // Gemini does not allow additionalProperties or $schema in its Schema object
    if (key === "additionalProperties") continue;
    if (key === "$schema") continue;
    
    // Handle array types generated for nullable fields (e.g. ["string", "null"])
    if (key === "type" && Array.isArray(value)) {
      const nonNullType = value.find(v => v !== "null");
      if (nonNullType) {
        result["type"] = typeof nonNullType === "string" ? nonNullType.toUpperCase() : nonNullType;
        if (value.includes("null")) {
          result["nullable"] = true;
        }
      }
      continue;
    }

    // Convert standard string types to uppercase for Gemini enum safety
    if (key === "type" && typeof value === "string") {
       result[key] = value.toUpperCase();
       continue;
    }

    result[key] = adaptSchemaForGemini(value);
  }
  return result;
}

const RAW_JSON_SCHEMA = z.toJSONSchema(ResumeExtractionSchema, {
  reused: "inline", // inline all definitions so Gemini sees a flat schema
});

const GEMINI_JSON_SCHEMA = adaptSchemaForGemini(RAW_JSON_SCHEMA);

export class GeminiProvider implements AIProvider {
  private readonly apiKey: string;

  constructor() {
    const key = Deno.env.get("GEMINI_API_KEY");
    if (!key) {
      throw new Error("Missing GEMINI_API_KEY environment variable.");
    }
    this.apiKey = key;
  }

  async analyzeResume(resumeText: string, promptVersion: string): Promise<string> {
    if (promptVersion !== RESUME_ANALYSIS_PROMPT.version) {
      throw new Error(
        `Unknown prompt version "${promptVersion}". Expected "${RESUME_ANALYSIS_PROMPT.version}".`
      );
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: RESUME_ANALYSIS_PROMPT.system }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: resumeText }]
          }
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: GEMINI_JSON_SCHEMA,
        }
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
      throw new Error(
        `Gemini API error ${response.status}: ${statusDetails}`
      );
    }

    const data = await response.json();

    const candidate = data.candidates?.[0];

    if (!candidate) {
      // Check if it was blocked by safety settings or other reasons without candidates
      const promptFeedback = data.promptFeedback;
      if (promptFeedback?.blockReason) {
        throw new Error(`Gemini request blocked. Reason: ${promptFeedback.blockReason}`);
      }
      throw new Error("Gemini returned an empty candidates array.");
    }

    // Reject any non-normal completion. For this extraction pipeline we
    // only trust a clean "STOP" — anything else means the output may be incomplete or absent.
    if (candidate.finishReason !== "STOP") {
      throw new Error(
        `Gemini did not complete normally. finishReason: ${candidate.finishReason}`
      );
    }

    const content = candidate.content?.parts?.[0]?.text;

    if (content === null || content === undefined) {
      throw new Error(
        `Gemini returned null content. finishReason: ${candidate.finishReason}`
      );
    }

    return content;
  }
}
