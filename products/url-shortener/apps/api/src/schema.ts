import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const urls = sqliteTable("urls", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  originalUrl: text("original_url").notNull(),
  userId: text("user_id").notNull(),
  title: text("title"),
  clicks: integer("clicks").notNull().default(0),
  isCustom: integer("is_custom").notNull().default(0),
  isActive: integer("is_active").notNull().default(1),
  expiresAt: text("expires_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
