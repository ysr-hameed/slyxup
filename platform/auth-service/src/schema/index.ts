import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash"),
  googleId: text("google_id"),
  githubId: text("github_id"),
  avatarUrl: text("avatar_url"),
  blocked: integer("blocked").notNull().default(0),
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
