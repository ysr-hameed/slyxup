import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as authSchema from "./schema/auth";
import * as billingSchema from "./schema/billing";
import * as analyticsSchema from "./schema/analytics";
import * as adminSchema from "./schema/admin";

export function createAuthDb(db: D1Database) {
  return drizzle(db, { schema: authSchema });
}

export function createBillingDb(db: D1Database) {
  return drizzle(db, { schema: billingSchema });
}

export function createAnalyticsDb(db: D1Database) {
  return drizzle(db, { schema: analyticsSchema });
}

export function createAdminDb(db: D1Database) {
  return drizzle(db, { schema: adminSchema });
}

export type AuthDb = ReturnType<typeof createAuthDb>;
export type BillingDb = ReturnType<typeof createBillingDb>;
export type AnalyticsDb = ReturnType<typeof createAnalyticsDb>;
export type AdminDb = ReturnType<typeof createAdminDb>;
