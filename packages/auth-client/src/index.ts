export interface AuthClientConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  platform?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  platform?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
}

export interface LoginResponse {
  token: string;
  jwt: string;
  user: AuthUser;
}

export interface SessionInfo {
  id: string;
  ip: string | null;
  userAgent: string | null;
  lastSeen: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface AuthClient {
  login(data: LoginRequest): Promise<LoginResponse>;
  register(data: RegisterRequest): Promise<{ id: string; email: string }>;
  logout(token: string): Promise<void>;
  me(token: string): Promise<AuthUser>;
  verifyEmail(token: string): Promise<{ message: string }>;
  forgotPassword(email: string): Promise<{ message: string }>;
  resetPassword(token: string, password: string): Promise<{ message: string }>;
  changePassword(token: string, currentPassword: string, newPassword: string): Promise<{ message: string }>;
  updateProfile(token: string, data: { name?: string; avatarUrl?: string }): Promise<AuthUser>;
  deleteAccount(token: string): Promise<{ message: string }>;
  resendVerification(email: string): Promise<{ message: string }>;
  listSessions(token: string): Promise<SessionInfo[]>;
  revokeSession(token: string, sessionId: string): Promise<{ message: string }>;
}

export function createAuthClient(config: AuthClientConfig): AuthClient {
  const headers = (token?: string): Record<string, string> => ({
    "Content-Type": "application/json",
    ...(config.apiKey ? { "X-API-Key": config.apiKey } : {}),
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  });

  return {
    async login(data) {
      const res = await fetch(`${config.baseUrl}/api/auth/login`, {
        method: "POST", headers: headers(), body: JSON.stringify(data),
      });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as LoginResponse;
    },

    async register(data) {
      const res = await fetch(`${config.baseUrl}/api/auth/register`, {
        method: "POST", headers: headers(), body: JSON.stringify(data),
      });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },

    async logout(token: string) {
      const res = await fetch(`${config.baseUrl}/api/auth/logout`, { method: "POST", headers: headers(token) });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
    },

    async me(token: string) {
      const res = await fetch(`${config.baseUrl}/api/auth/me`, { headers: headers(token) });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as AuthUser;
    },

    async verifyEmail(token: string) {
      const res = await fetch(`${config.baseUrl}/api/auth/verify?token=${encodeURIComponent(token)}`, { headers: headers() });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },

    async forgotPassword(email: string) {
      const res = await fetch(`${config.baseUrl}/api/auth/forgot-password`, {
        method: "POST", headers: headers(), body: JSON.stringify({ email }),
      });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },

    async resetPassword(token: string, password: string) {
      const res = await fetch(`${config.baseUrl}/api/auth/reset-password`, {
        method: "POST", headers: headers(), body: JSON.stringify({ token, password }),
      });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },

    async changePassword(token: string, currentPassword: string, newPassword: string) {
      const res = await fetch(`${config.baseUrl}/api/auth/change-password`, {
        method: "POST", headers: headers(token), body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },

    async updateProfile(token: string, data: { name?: string; avatarUrl?: string }) {
      const res = await fetch(`${config.baseUrl}/api/auth/me`, {
        method: "PATCH", headers: headers(token), body: JSON.stringify(data),
      });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as AuthUser;
    },

    async deleteAccount(token: string) {
      const res = await fetch(`${config.baseUrl}/api/auth/me`, { method: "DELETE", headers: headers(token) });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },

    async resendVerification(email: string) {
      const res = await fetch(`${config.baseUrl}/api/auth/resend-verification`, {
        method: "POST", headers: headers(), body: JSON.stringify({ email }),
      });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },

    async listSessions(token: string) {
      const res = await fetch(`${config.baseUrl}/api/auth/sessions`, { headers: headers(token) });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as SessionInfo[];
    },

    async revokeSession(token: string, sessionId: string) {
      const res = await fetch(`${config.baseUrl}/api/auth/sessions/${sessionId}`, { method: "DELETE", headers: headers(token) });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  };
}
