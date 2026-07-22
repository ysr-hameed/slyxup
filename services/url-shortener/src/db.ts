import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const urls = sqliteTable("urls", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  code: text("code").notNull().unique(),
  target: text("target").notNull(),
  title: text("title"),
  clicks: integer("clicks").notNull().default(0),
  createdAt: text("created_at").notNull().default("datetime('now')"),
  updatedAt: text("updated_at").notNull().default("datetime('now')"),
});
