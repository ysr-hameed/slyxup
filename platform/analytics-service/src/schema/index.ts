import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  userId: text("user_id"),
  platform: text("platform").notNull(),
  properties: text("properties"),
  createdAt: text("created_at").notNull(),
});

export const pageViews = sqliteTable("page_views", {
  id: text("id").primaryKey(),
  path: text("path").notNull(),
  userId: text("user_id"),
  platform: text("platform").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ip: text("ip"),
  createdAt: text("created_at").notNull(),
});
