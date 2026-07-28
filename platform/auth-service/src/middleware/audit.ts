import type { Context } from "hono";
import type { AuthEnv } from "@slyxup/shared";
import { generateId } from "@slyxup/shared";

export async function logAudit(
  c: Context<{ Bindings: AuthEnv }>,
  action: string,
  userId?: string,
  details?: string,
) {
  try {
    const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? null;
    const userAgent = c.req.header("User-Agent") ?? null;
    await c.env.DB
      .prepare(
        "INSERT INTO audit_logs (id, user_id, action, details, ip, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        generateId(),
        userId ?? null,
        action,
        details ?? null,
        ip,
        userAgent,
        new Date().toISOString(),
      )
      .run();
  } catch {
    // audit log failure must never break the request
  }
}
