import { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { StorageProvider } from "./interfaces/storage.provider.interface.ts";

export class SupabaseStorageProvider implements StorageProvider {
  constructor(private supabase: SupabaseClient) {}

  async downloadFile(bucket: string, path: string): Promise<ArrayBuffer> {
    const { data, error } = await this.supabase
      .storage
      .from(bucket)
      .download(path);

    if (error) {
      throw new Error(`Storage download failed: ${error.message}`);
    }

    return await data.arrayBuffer();
  }
}
