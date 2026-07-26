import { API_BASE } from "../config";

export interface UrlEntry {
  id: string;
  slug: string;
  originalUrl: string;
  title: string | null;
  clicks: number;
  isCustom: number;
  isActive: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUrlResult {
  id: string;
  slug: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  plan: "free" | "pro";
  expiresAt: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  nextCursor?: string;
}

export function createUrlClient(jwt: string) {
  const headers = {
    Authorization: `Bearer ${jwt}`,
  };

  const postHeaders = {
    ...headers,
    "Content-Type": "application/json",
  };

  async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${url}`, init);
    const json: ApiResponse<T> = await res.json();
    if (!json.success) throw new Error(json.error || "Request failed");
    return json.data as T;
  }

  return {
    list(cursor?: string, limit = 20): Promise<{ items: UrlEntry[]; nextCursor?: string }> {
      const params = new URLSearchParams({ limit: String(limit) });
      if (cursor) params.set("cursor", cursor);
      return request(`/api/url?${params}`, { headers });
    },

    async create(url: string, slug?: string, title?: string): Promise<CreateUrlResult> {
      const body: Record<string, string> = { url };
      if (slug) body.slug = slug;
      if (title) body.title = title;

      const res = await fetch(`${API_BASE}/api/url`, {
        method: "POST",
        headers: postHeaders,
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to create URL");
      return json.data as CreateUrlResult;
    },

    remove(id: string): Promise<void> {
      return request(`/api/url/${id}`, { method: "DELETE", headers });
    },
  };
}
