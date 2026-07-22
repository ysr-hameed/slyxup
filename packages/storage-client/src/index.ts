export interface StorageClientConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface UploadResult {
  key: string;
  url: string;
}

export interface FileItem {
  key: string;
  size: number;
  etag: string;
  uploaded: string;
}

export interface StorageClient {
  upload(file: File, key?: string): Promise<UploadResult>;
  getDownloadUrl(key: string): string;
  list(prefix?: string): Promise<FileItem[]>;
}

export function createStorageClient(config: StorageClientConfig): StorageClient {
  const headers: Record<string, string> = {
    ...(config.apiKey ? { "X-API-Key": config.apiKey } : {}),
  };

  return {
    async upload(file, key) {
      const form = new FormData();
      form.append("file", file);
      if (key) form.append("key", key);
      const res = await fetch(`${config.baseUrl}/api/storage/upload`, {
        method: "POST", headers, body: form,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as UploadResult;
    },

    getDownloadUrl(key: string) {
      return `${config.baseUrl}/api/storage/download?key=${encodeURIComponent(key)}`;
    },

    async list(prefix) {
      const params = prefix ? `?prefix=${prefix}` : "";
      const res = await fetch(`${config.baseUrl}/api/storage/list${params}`, { headers });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as FileItem[];
    },
  };
}
