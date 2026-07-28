export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  EMAIL?: {
    send: (msg: {
      to: string;
      from: { email: string; name?: string };
      subject: string;
      html: string;
      text: string;
    }) => Promise<{ delivered: string[] }>;
  };

  // ─── General ───────────────────────────────────────────
  NODE_ENV?: "development" | "production" | "preview";
  API_BASE_URL: string;
  FRONTEND_URL: string;
  CORS_ORIGIN: string;
  ENVIRONMENT?: "development" | "production" | "preview";
  ENCRYPTION_KEY: string;
  JWT_SECRET: string;
  CRON_SECRET: string;

  // ─── Better Auth ────────────────────────────────────────
  BETTER_AUTH_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_TRUSTED_ORIGINS?: string;

  // ─── OAuth ──────────────────────────────────────────────
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  META_APP_ID?: string;
  META_APP_SECRET?: string;

  // ─── Email (Brevo) ──────────────────────────────────────
  BREVO_API_KEY?: string;
  EMAIL_FROM?: string;
  SUPPORT_EMAIL?: string;

  // ─── Billing (Paddle) ───────────────────────────────────
  PADDLE_ENVIRONMENT: "sandbox" | "production";
  PADDLE_VENDOR_ID?: string;
  PADDLE_API_KEY?: string;
  PADDLE_WEBHOOK_SECRET?: string;
  PADDLE_WEBHOOK_URL?: string;

  // ─── Renderer ───────────────────────────────────────────
  RENDERER_URL?: string;
  RENDERER_API_KEY?: string;

  // ─── File Storage (R2) ─────────────────────────────────
  R2_PUBLIC_URL_BASE?: string;

  // ─── External APIs ──────────────────────────────────────
  PEXELS_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

export type Variables = {
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image: string | null;
  } | null;
  session: {
    id: string;
    userId: string;
    expiresAt: string;
  } | null;
};
