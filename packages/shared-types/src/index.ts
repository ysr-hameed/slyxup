export interface Platform {
  id: string;
  slug: string;
  name: string | null;
  domain: string | null;
  status: "active" | "inactive";
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  google_id: string | null;
  github_id: string | null;
  avatar_url: string | null;
  blocked: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformMembership {
  id: string;
  user_id: string;
  platform_id: string;
  role: "member" | "admin" | "owner";
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  ip: string | null;
  user_agent: string | null;
  last_seen: string | null;
  revoked_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  platform: string;
  status: "active" | "canceled" | "past_due" | "incomplete" | "trialing";
  current_period_start: string;
  current_period_end: string;
  paddle_subscription_id: string | null;
  paddle_customer_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  platform: string;
  amount: number;
  currency: string;
  interval: "month" | "year";
  paddle_price_id: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  subscription_id: string;
  user_id: string;
  platform: string;
  amount: number;
  currency: string;
  status: "paid" | "unpaid" | "past_due";
  paddle_invoice_id: string | null;
  deleted_at: string | null;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  platform_id: string;
  exp: number;
  iat: number;
}

export interface AuthEnv {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  BREVO_API_KEY: string;
  EMAIL_FROM: string;
  ENVIRONMENT: string;
}

export interface PaymentEnv {
  DB: D1Database;
  PADDLE_API_KEY: string;
  PADDLE_WEBHOOK_SECRET: string;
  PADDLE_ENVIRONMENT: "sandbox" | "production";
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

export interface AdminEnv {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_JWT_SECRET: string;
  AUTH_URL: string;
  PAYMENT_URL: string;
  ENVIRONMENT: string;
}

export type AdminRole = "superadmin" | "billing_admin" | "support_admin" | "developer" | "readonly";

export interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: AdminRole;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  resource: string;
  resource_id: string | null;
  details: string | null;
  ip: string | null;
  user_agent: string | null;
  request_id: string | null;
  success: number;
  created_at: string;
}

export interface TestResult {
  id: string;
  test_name: string;
  endpoint: string;
  passed: boolean;
  response_status: number | null;
  response_body: string | null;
  error: string | null;
  run_at: string;
}
