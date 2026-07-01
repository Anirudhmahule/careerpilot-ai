export interface AIProvider {
  analyzeResume(text: string, promptVersion: string): Promise<string>;
}
