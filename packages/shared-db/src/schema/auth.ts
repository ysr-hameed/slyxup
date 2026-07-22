import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const platforms = sqliteTable("platforms", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name"),
  domain: text("domain"),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  createdAt: text("created_at").notNull().default("datetime('now')"),
});

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name"),
    passwordHash: text("password_hash"),
    googleId: text("google_id"),
    githubId: text("github_id"),
    avatarUrl: text("avatar_url"),
    blocked: integer("blocked").notNull().default(0),
    deletedAt: text("deleted_at"),
    createdAt: text("created_at").notNull().default("datetime('now')"),
    updatedAt: text("updated_at").notNull().default("datetime('now')"),
  },
  (t) => ({
    emailIdx: index("idx_users_email").on(t.email),
    googleIdIdx: index("idx_users_google_id").on(t.googleId),
    githubIdIdx: index("idx_users_github_id").on(t.githubId),
  }),
);

export const platformMemberships = sqliteTable(
  "platform_memberships",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    platformId: text("platform_id").notNull().references(() => platforms.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["member", "admin", "owner"] }).notNull().default("member"),
    createdAt: text("created_at").notNull().default("datetime('now')"),
  },
  (t) => ({
    userPlatformIdx: uniqueIndex("idx_membership_user_platform").on(t.userId, t.platformId),
    platformIdx: index("idx_membership_platform").on(t.platformId),
  }),
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    lastSeen: text("last_seen"),
    revokedAt: text("revoked_at"),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default("datetime('now')"),
  },
  (t) => ({
    tokenIdx: index("idx_sessions_token").on(t.token),
    userIdIdx: index("idx_sessions_user_id").on(t.userId),
  }),
);
