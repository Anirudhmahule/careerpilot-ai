import { AIProvider } from "./interfaces/ai.provider.interface.ts";

export class OpenAIProvider implements AIProvider {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async analyzeResume(text: string, promptVersion: string): Promise<string> {
    // Stub implementation for now.
    // In the future, this will use the official OpenAI SDK or fetch API.
    return Promise.resolve(JSON.stringify({
      skills: ["Stubbed Skill 1", "Stubbed Skill 2"],
      score: 85,
      feedback: "This is a stubbed response from OpenAIProvider based on prompt version: " + promptVersion
    }));
  }
}
