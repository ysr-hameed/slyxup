const API_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:8787";

interface SignUpParams {
  email: string;
  password: string;
  name: string;
}

interface SignInParams {
  email: string;
  password: string;
}

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error ?? error.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export const authClient = {
  signUp: (params: SignUpParams) =>
    request<AuthResponse>("/api/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  signIn: (params: SignInParams) =>
    request<AuthResponse>("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify(params),
    }),

  signOut: () =>
    request<{ success: boolean }>("/api/auth/sign-out", {
      method: "POST",
      body: "{}",
    }),

  revokeAllSessions: () =>
    request<{ success: boolean }>("/api/auth/revoke-sessions", {
      method: "POST",
    }),

  getSession: () =>
    request<{ user: AuthResponse["user"]; session: { id: string } } | null>(
      "/api/auth/get-session",
    ),

  forgotPassword: (email: string) =>
    request<{ success: boolean; status: boolean }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ success: boolean }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),

  signInWithOAuth: (provider: "google" | "github") => {
    window.location.href = `${API_BASE}/api/auth/oauth2/${provider}`;
  },
};
