import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const urls = sqliteTable("urls", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  originalUrl: text("original_url").notNull(),
  userId: text("user_id").notNull(),
  clicks: integer("clicks").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
