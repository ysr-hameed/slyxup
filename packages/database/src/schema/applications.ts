import { sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const applications = sqliteTable(
  "application",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    domain: text("domain"),
    allowedOrigins: text("allowed_origins", { mode: "json" }).$type<string[]>().default([]),
    redirectUrls: text("redirect_urls", { mode: "json" }).$type<string[]>().default([]),
    publishableKey: text("publishable_key").notNull().unique(),
    secretKey: text("secret_key").notNull().unique(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("application_ownerId_idx").on(table.ownerId),
  ],
);
