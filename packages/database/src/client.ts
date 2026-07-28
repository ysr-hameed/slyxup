import { drizzle } from "drizzle-orm/d1";
import { schema } from "./schema";

export function createClient(db: D1Database) {
  return drizzle(db, { schema });
}

export type DbClient = ReturnType<typeof createClient>;
