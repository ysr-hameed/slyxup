import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const notificationTemplates = sqliteTable("notification_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  platform: text("platform"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const notificationLogs = sqliteTable("notification_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  channel: text("channel").notNull(),
  toAddress: text("to_address").notNull(),
  subject: text("subject"),
  status: text("status").notNull().default("pending"),
  error: text("error"),
  sentAt: text("sent_at"),
  createdAt: text("created_at").notNull(),
});
