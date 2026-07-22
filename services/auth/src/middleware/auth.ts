import type { Context, Next } from "hono";
import type { AuthEnv } from "@slyxup/shared-types";
import { createAuthMiddleware } from "@slyxup/shared-auth";

export const authMiddleware = createAuthMiddleware((c: Context) => {
  const env = c.env as AuthEnv;
  return env.JWT_SECRET;
});
