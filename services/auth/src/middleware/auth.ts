import type { Context, Next } from "hono";
import type { AuthEnv } from "@slyxup/shared-types";
import { verifyToken } from "@slyxup/shared-utils";

export async function authMiddleware(
  c: Context<{ Bindings: AuthEnv }>,
  next: Next,
) {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  const payload = await verifyToken(auth.slice(7), c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ success: false, error: "Invalid or expired token" }, 401);
  }
  (c as any).set("userId", payload.sub);
  (c as any).set("userEmail", payload.email);
  await next();
}
