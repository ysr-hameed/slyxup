export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl?: string | null;
  emailVerified: boolean;
}

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  API_KEY: string;
  AUTH_SERVICE_URL: string;
  BILLING_SERVICE_URL: string;
  EMAIL_SERVICE_URL: string;
  ANALYTICS_SERVICE_URL: string;
  STORAGE_SERVICE_URL: string;
  ENVIRONMENT: string;
}

export interface PlanLimits {
  maxUrls: number;
  customSlug: boolean;
  slugLength: number;
}

export const FREE_PLAN: PlanLimits = { maxUrls: 10, customSlug: false, slugLength: 6 };
export const PRO_PLAN: PlanLimits = { maxUrls: 1000, customSlug: true, slugLength: 4 };
