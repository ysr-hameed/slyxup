import type { AuthUser, AuthSession } from "@slyxup/shared";
import { AuthError } from "./errors";

export interface SdkConfig {
  publishableKey: string;
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
}

interface SignUpInput {
  email: string;
  password: string;
  name: string;
}

interface SignInInput {
  email: string;
  password: string;
}

interface SignUpResponse {
  user: AuthUser;
  token: string;
}

interface SignInResponse {
  user: AuthUser;
  token: string;
  redirect?: boolean;
}

interface SessionResponse {
  user: AuthUser;
  session: AuthSession;
}

export class AuthClient {
  private baseUrl: string;
  private publishableKey: string;
  private fetchFn: typeof globalThis.fetch;

  constructor(config: SdkConfig) {
    this.baseUrl = config.baseUrl ?? "http://localhost:8787";
    this.publishableKey = config.publishableKey;
    this.fetchFn = config.fetch ?? globalThis.fetch;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await this.fetchFn(`${this.baseUrl}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Publishable-Key": this.publishableKey,
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new AuthError(
        (body as { error?: string; message?: string }).error ?? (body as { message?: string }).message ?? `HTTP ${res.status}`,
        res.status,
      );
    }

    return res.json() as Promise<T>;
  }

  async signUp(input: SignUpInput): Promise<SignUpResponse> {
    return this.request<SignUpResponse>("/api/auth/sign-up/email", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async signIn(input: SignInInput): Promise<SignInResponse> {
    return this.request<SignInResponse>("/api/auth/sign-in/email", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async signOut(): Promise<void> {
    await this.request("/api/auth/sign-out", { method: "POST", body: "{}" });
  }

  async getSession(): Promise<SessionResponse | null> {
    try {
      return await this.request<SessionResponse>("/api/auth/get-session");
    } catch {
      return null;
    }
  }

  async getUser(): Promise<AuthUser | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  }
}
