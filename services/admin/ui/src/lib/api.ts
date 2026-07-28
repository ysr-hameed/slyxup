const API_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:8787";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export interface Application {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  allowedOrigins: string[];
  redirectUrls: string[];
  publishableKey: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppInput {
  name: string;
  slug: string;
  domain?: string;
  allowedOrigins?: string[];
  redirectUrls?: string[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  emailVerified: number;
  image: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface AdminSession {
  id: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuditLog {
  id: string;
  event: string;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: string | null;
  createdAt: string;
}

export const api = {
  getSession: () =>
    request<{ user: { id: string; name: string; email: string }; session: { id: string } } | null>("/api/auth/get-session"),

  signOut: () =>
    request<{ success: boolean }>("/api/auth/sign-out", { method: "POST", body: "{}" }),

  getApplications: () =>
    request<{ success: boolean; data: Application[] }>("/api/applications"),

  getApplication: (id: string) =>
    request<{ success: boolean; data: Application }>(`/api/applications/${id}`),

  createApplication: (input: CreateAppInput) =>
    request<{ success: boolean; data: Application }>("/api/applications", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  deleteApplication: (id: string) =>
    request<{ success: boolean }>(`/api/applications/${id}`, { method: "DELETE" }),

  getUsers: () =>
    request<{ success: boolean; data: AdminUser[] }>("/api/admin/users"),

  getUser: (id: string) =>
    request<{ success: boolean; data: AdminUser }>(`/api/admin/users/${id}`),

  getSessions: () =>
    request<{ success: boolean; data: AdminSession[] }>("/api/admin/sessions"),

  getAuditLogs: (offset?: number, limit?: number) =>
    request<{ success: boolean; data: AuditLog[] }>(`/api/admin/audit-logs?offset=${offset ?? 0}&limit=${limit ?? 50}`),
};
