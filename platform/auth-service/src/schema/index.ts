import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  googleId: text("google_id"),
  githubId: text("github_id"),
  avatarUrl: text("avatar_url"),
  authProvider: text("auth_provider", { enum: ["email", "google", "github"] }).default("email").notNull(),
  blocked: integer("blocked").notNull().default(0),
  blockedAt: text("blocked_at"),
  blockedReason: text("blocked_reason"),
  emailVerified: integer("email_verified").notNull().default(0),
  emailVerificationToken: text("email_verification_token"),
  verificationCode: text("verification_code"),
  verificationExpiry: text("verification_expiry"),
  verificationAttempts: integer("verification_attempts").notNull().default(0),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: text("locked_until"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: text("password_reset_expires"),
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).notNull().default(false),
  twoFactorSecret: text("two_factor_secret"),
  email2FAEnabled: integer("email_2fa_enabled", { mode: "boolean" }).notNull().default(false),
  preferred2FA: text("preferred_2fa", { enum: ["authenticator", "email"] }).default("authenticator"),
  loginOTP: text("login_otp"),
  loginOTPExpiry: text("login_otp_expiry"),
  backupCodes: text("backup_codes"),
  plan: text("plan").default("free").notNull(),
  pendingPlan: text("pending_plan"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  lastSeen: text("last_seen"),
  revokedAt: text("revoked_at"),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const oauthAccounts = sqliteTable("oauth_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
  providerUserId: text("provider_user_id").notNull(),
  createdAt: text("created_at").notNull(),
});

export const platforms = sqliteTable("platforms", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name"),
  domain: text("domain"),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull(),
});

export const platformMemberships = sqliteTable("platform_memberships", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  platformId: text("platform_id").notNull(),
  role: text("role").notNull().default("member"),
  createdAt: text("created_at").notNull(),
});

export const rateLimits = sqliteTable("rate_limits", {
  ip: text("ip").notNull(),
  route: text("route").notNull(),
  count: integer("count").notNull().default(1),
  windowStart: text("window_start").notNull(),
});

export const authAuditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  action: text("action").notNull(),
  details: text("details"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull(),
});

export const oauthStates = sqliteTable("oauth_states", {
  id: text("id").primaryKey(),
  state: text("state").notNull().unique(),
  provider: text("provider").notNull(),
  redirectTo: text("redirect_to"),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const revokedTokens = sqliteTable("revoked_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const securityLogs = sqliteTable("security_logs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  userId: text("user_id"),
  ip: text("ip"),
  data: text("data").notNull(),
  createdAt: text("created_at").notNull(),
}, (table) => [
  index("security_logs_type_idx").on(table.type),
  index("security_logs_user_id_idx").on(table.userId),
]);

export const trustedDevices = sqliteTable("trusted_devices", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  fingerprint: text("fingerprint").notNull(),
  trustedAt: text("trusted_at").notNull(),
  expiresAt: integer("expires_at").notNull(),
  deviceName: text("device_name"),
}, (table) => [
  index("trusted_devices_user_id_idx").on(table.userId),
  uniqueIndex("trusted_devices_user_fingerprint_unique").on(table.userId, table.fingerprint),
]);

export const blockedIPs = sqliteTable("blocked_ips", {
  id: text("id").primaryKey(),
  ip: text("ip").notNull().unique(),
  reason: text("reason").notNull(),
  blockedAt: text("blocked_at").notNull(),
  expiresAt: text("expires_at"),
  permanent: integer("permanent", { mode: "boolean" }).notNull().default(true),
});
