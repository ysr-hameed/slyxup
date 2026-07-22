import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const adminUsers = sqliteTable("admin_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  role: text("role", {
    enum: ["superadmin", "billing_admin", "support_admin", "developer", "readonly"],
  }).notNull().default("readonly"),
  deletedAt: text("deleted_at"),
  createdAt: text("created_at").notNull().default("datetime('now')"),
  updatedAt: text("updated_at").notNull().default("datetime('now')"),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  adminId: text("admin_id").notNull(),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: text("resource_id"),
  details: text("details"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  requestId: text("request_id"),
  success: integer("success").notNull().default(1),
  createdAt: text("created_at").notNull().default("datetime('now')"),
});
