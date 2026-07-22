export interface AdminClientConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  resource: string;
  details: string | null;
  platform: string | null;
  created_at: string;
}

export interface DashboardStats {
  adminUsers: number;
  auditLogs: number;
}

export interface AdminClient {
  getDashboard(): Promise<DashboardStats>;
  listUsers(): Promise<AdminUser[]>;
  createUser(email: string, name: string, role?: string): Promise<AdminUser>;
  listAuditLogs(): Promise<AuditLogEntry[]>;
  createAuditLog(adminId: string, action: string, resource: string, details?: string, platform?: string): Promise<AuditLogEntry>;
}

export function createAdminClient(config: AdminClientConfig): AdminClient {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.apiKey ? { "X-Admin-Key": config.apiKey } : {}),
  };

  async function request<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${config.baseUrl}/api/admin${path}`, {
      method: body ? "POST" : "GET",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data as T;
  }

  return {
    getDashboard: () => request<DashboardStats>("/dashboard"),
    listUsers: () => request<AdminUser[]>("/users"),
    createUser: (email, name, role) => request<AdminUser>("/users", { email, name, role }),
    listAuditLogs: () => request<AuditLogEntry[]>("/audit-logs"),
    createAuditLog: (adminId, action, resource, details, platform) =>
      request<AuditLogEntry>("/audit-logs", { admin_id: adminId, action, resource, details, platform }),
  };
}
