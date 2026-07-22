import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name"),
    platform: text("platform").notNull().default("default"),
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
    platformIdx: index("idx_users_platform").on(t.platform),
    googleIdIdx: index("idx_users_google_id").on(t.googleId),
    githubIdIdx: index("idx_users_github_id").on(t.githubId),
  }),
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull().default("datetime('now')"),
  },
  (t) => ({
    tokenIdx: index("idx_sessions_token").on(t.token),
    userIdIdx: index("idx_sessions_user_id").on(t.userId),
  }),
);
