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
  const authHeaders: Record<string, string> = {
    ...(config.apiKey ? { "X-Admin-Key": config.apiKey } : {}),
  };

  async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${config.baseUrl}/api/admin${path}`, { headers: authHeaders });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data as T;
  }

  async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${config.baseUrl}/api/admin${path}`, {
      method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data as T;
  }

  return {
    getDashboard: () => get<DashboardStats>("/dashboard"),
    listUsers: () => get<AdminUser[]>("/users"),
    createUser: (email, name, role) => post<AdminUser>("/users", { email, name, role }),
    listAuditLogs: () => get<AuditLogEntry[]>("/audit-logs"),
    createAuditLog: (adminId, action, resource, details, platform) =>
      post<AuditLogEntry>("/audit-logs", { admin_id: adminId, action, resource, details, platform }),
  };
}
