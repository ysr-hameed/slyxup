import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";

export const auditLogs = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    event: text("event").notNull(),
    userId: text("user_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: text("metadata"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("audit_log_event_idx").on(table.event),
    index("audit_log_userId_idx").on(table.userId),
    index("audit_log_createdAt_idx").on(table.createdAt),
  ],
);
