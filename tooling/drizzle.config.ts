import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./packages/database/drizzle",
  schema: "./packages/database/src/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? ".wrangler/state/d1/DB.sqlite",
  },
  tablesFilter: ["user", "session", "account", "verification", "application"],
});
