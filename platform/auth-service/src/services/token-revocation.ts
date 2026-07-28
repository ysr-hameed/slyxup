import { hashToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";

export async function revokeToken(db: D1Database, token: string): Promise<void> {
  try {
    const drizzle = createDb(db);
    const hash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await drizzle.insert(schema.revokedTokens).values({ tokenHash: hash, expiresAt, createdAt: new Date().toISOString() }).run();
  } catch { /* best-effort */ }
}

export async function isTokenRevoked(db: D1Database, token: string): Promise<boolean> {
  try {
    const drizzle = createDb(db);
    const hash = await hashToken(token);
    const result = await drizzle.select().from(schema.revokedTokens).where(eq(schema.revokedTokens.tokenHash, hash)).get();
    if (!result) return false;
    if (result.expiresAt < new Date().toISOString()) {
      await drizzle.delete(schema.revokedTokens).where(eq(schema.revokedTokens.tokenHash, hash)).run();
      return false;
    }
    return true;
  } catch { return false }
}

export async function revokeAllUserTokens(db: D1Database, userId: string): Promise<void> {
  try {
    const marker = `revoke_all:${userId}`;
    const hash = await hashToken(marker);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const drizzle = createDb(db);
    await drizzle.insert(schema.revokedTokens).values({ tokenHash: hash, expiresAt, createdAt: new Date().toISOString() }).run();
  } catch { /* best-effort */ }
}
