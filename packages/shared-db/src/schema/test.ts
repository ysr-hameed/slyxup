import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const testResults = sqliteTable("test_results", {
  id: text("id").primaryKey(),
  testName: text("test_name").notNull(),
  endpoint: text("endpoint").notNull(),
  passed: integer("passed", { mode: "boolean" }).notNull(),
  responseStatus: integer("response_status"),
  responseBody: text("response_body"),
  error: text("error"),
  runAt: text("run_at").notNull().default("datetime('now')"),
});
