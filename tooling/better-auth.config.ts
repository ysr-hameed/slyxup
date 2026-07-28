import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth";

const sqlite = new Database(":memory:");
const db = drizzle(sqlite);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite" }),
  baseURL: "http://localhost:8787",
  secret: "cli-secret",

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: { clientId: "", clientSecret: "", enabled: false },
    github: { clientId: "", clientSecret: "", enabled: false },
  },

  user: {
    changeEmail: { enabled: true },
    deleteUser: { enabled: true },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
  },
});
