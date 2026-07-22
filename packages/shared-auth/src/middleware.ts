import type { Context, Next } from "hono";
import { verifyToken } from "@slyxup/shared-utils";

export function createAuthMiddleware(secret: string | ((c: Context) => string)) {
  return async function authMiddleware(c: Context, next: Next) {
    const auth = c.req.header("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return c.json({ success: false, error: "Unauthorized" }, 401);
    }

    const jwtSecret = typeof secret === "function" ? secret(c) : secret;
    const payload = await verifyToken(auth.slice(7), jwtSecret);
    if (!payload) {
      return c.json({ success: false, error: "Invalid or expired token" }, 401);
    }

    c.set("userId", payload.sub);
    c.set("userEmail", payload.email);
    c.set("platform", payload.platform_id);

    await next();
  };
}
