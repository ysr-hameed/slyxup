import type { Context, Next } from "hono";
import type { AdminEnv } from "@slyxup/shared";
import { verifyToken } from "@slyxup/shared";
import { logger } from "@slyxup/logger";

type AdminContext = Context<{ Bindings: AdminEnv; Variables: { adminId: string } }>;

export async function auth(c: AdminContext, next: Next) {
  const adminKey = c.req.header("X-Admin-Key");
  if (adminKey === c.env.ADMIN_KEY) {
    return next();
  }

  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const payload = await verifyToken(authHeader.slice(7), c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ success: false, error: "Invalid or expired token" }, 401);
  }

  c.set("adminId", payload.sub);
  return next();
}
