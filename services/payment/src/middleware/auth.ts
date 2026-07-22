import type { Context, Next } from "hono";
import type { PaymentEnv } from "@slyxup/shared-types";
import { createAuthMiddleware } from "@slyxup/shared-auth";

export const authMiddleware = createAuthMiddleware((c: Context) => {
  const env = c.env as PaymentEnv;
  return env.JWT_SECRET;
});
