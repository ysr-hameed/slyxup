import { vi } from "vitest";
import type { Env } from "../env";

const store = new Map<string, string>();

export function createMockEnv(): Env {
  return {
    DB: {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          all: vi.fn(() => Promise.resolve({ results: [], success: true })),
          first: vi.fn(() => Promise.resolve(null)),
          run: vi.fn(() => Promise.resolve({ success: true })),
          raw: vi.fn(() => Promise.resolve([])),
        })),
        all: vi.fn(() => Promise.resolve({ results: [], success: true })),
        first: vi.fn(() => Promise.resolve(null)),
        run: vi.fn(() => Promise.resolve({ success: true })),
        raw: vi.fn(() => Promise.resolve([])),
      })),
      batch: vi.fn(() => Promise.resolve([])),
      exec: vi.fn(() => Promise.resolve({ success: true })),
    } as unknown as D1Database,
    KV: {
      get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
      put: vi.fn((key: string, value: string) => {
        store.set(key, value);
        return Promise.resolve();
      }),
      delete: vi.fn((key: string) => {
        store.delete(key);
        return Promise.resolve();
      }),
      list: vi.fn(),
      getWithMetadata: vi.fn(),
    } as unknown as KVNamespace,
    NODE_ENV: "development",
    API_BASE_URL: "http://localhost:8787",
    FRONTEND_URL: "http://localhost:5173",
    CORS_ORIGIN: "http://localhost:5173",
    BETTER_AUTH_URL: "http://localhost:8787",
    BETTER_AUTH_SECRET: "test-secret",
    BETTER_AUTH_TRUSTED_ORIGINS: "http://localhost:5173",
    PADDLE_ENVIRONMENT: "sandbox",
    ENCRYPTION_KEY: "b70a274c64628076b7dceb78be5836f98adfd0a41df94f355bf5c9ea7a532bf6",
    JWT_SECRET: "dev-jwt-secret",
    CRON_SECRET: "dev-cron-secret",
  };
}

export let isAuthenticated = false;

const mockSessionData = {
  user: { id: "user_1", email: "test@demo.com", name: "Test", emailVerified: false, image: null },
  session: { id: "sess_1", userId: "user_1", expiresAt: new Date(Date.now() + 86400000) },
};

vi.mock("../lib/auth", () => ({
  createAuth: vi.fn(() => ({
    handler: vi.fn(() => new Response(JSON.stringify(mockSessionData), { status: 200 })),
    api: {
      getSession: vi.fn(() => {
        return Promise.resolve(isAuthenticated ? mockSessionData : null);
      }),
    },
  })),
}));

export function withAuth() {
  isAuthenticated = true;
  return { cookie: "better-auth-session=test-session" };
}

export function withoutAuth() {
  isAuthenticated = false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function request(app: any, path: string, init?: RequestInit, env?: Partial<Env>) {
  return app.request(path, init, { ...createMockEnv(), ...env } satisfies Env);
}
