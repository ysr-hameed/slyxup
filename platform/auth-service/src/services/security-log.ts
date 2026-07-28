import type { AuthEnv } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";

export function logSecurityEvent(env: AuthEnv, type: string, userId: string | undefined, ip: string, data: Record<string, unknown>): void {
  try {
    const db = createDb(env.DB);
    db.insert(schema.securityLogs).values({
      id: crypto.randomUUID(),
      type,
      userId: userId ?? null,
      ip: ip || "",
      data: JSON.stringify(data),
      createdAt: new Date().toISOString(),
    }).run().catch(() => {});
  } catch {
    // best-effort
  }
}
