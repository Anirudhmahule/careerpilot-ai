export interface StorageProvider {
  downloadFile(bucket: string, path: string): Promise<ArrayBuffer>;
}
