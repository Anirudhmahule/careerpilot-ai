import { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { SnapshotRepositoryInterface } from "../services/interfaces/snapshot.repository.interface.ts";
import { SnapshotStatus } from "../types/resume-analysis.types.ts";

export class SupabaseSnapshotRepository implements SnapshotRepositoryInterface {
  constructor(private supabase: SupabaseClient) {}

  async getStatus(id: string): Promise<SnapshotStatus | null> {
    const { data, error } = await this.supabase
      .from("analysis_snapshots")
      .select("status")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data.status as SnapshotStatus;
  }

  async markProcessing(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("analysis_snapshots")
      .update({ status: "processing" })
      .eq("id", id);
      
    if (error) {
      throw new Error(`Failed to mark processing: ${error.message}`);
    }
  }

  async markFailed(id: string, errorMessage: string, startTime: number): Promise<void> {
    const { error } = await this.supabase
      .from("analysis_snapshots")
      .update({
        status: "failed",
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      })
      .eq("id", id);
      
    if (error) {
      throw new Error(`Failed to mark failed: ${error.message}`);
    }
  }

  async markCompleted(id: string, rawResponse: unknown, startTime: number): Promise<void> {
    const { error } = await this.supabase
      .from("analysis_snapshots")
      .update({
        status: "completed",
        raw_response: rawResponse,
        completed_at: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
      })
      .eq("id", id);
      
    if (error) {
      throw new Error(`Failed to mark completed: ${error.message}`);
    }
  }
}
