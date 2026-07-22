import { drizzle } from "drizzle-orm/d1";
import * as authSchema from "./schema/auth";
import * as paymentSchema from "./schema/payment";
import * as adminSchema from "./schema/admin";
import * as testSchema from "./schema/test";

export function createAuthDb(db: D1Database) {
  return drizzle(db, { schema: authSchema });
}

export function createPaymentDb(db: D1Database) {
  return drizzle(db, { schema: paymentSchema });
}

export function createAdminDb(db: D1Database) {
  return drizzle(db, { schema: { ...adminSchema, ...testSchema } });
}

export { authSchema, paymentSchema, adminSchema, testSchema };
