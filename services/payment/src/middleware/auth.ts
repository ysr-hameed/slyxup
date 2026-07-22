import type { Context, Next } from "hono";
import type { PaymentEnv } from "@slyxup/shared-types";

export async function apiKeyMiddleware(
  c: Context<{ Bindings: PaymentEnv }>,
  next: Next,
) {
  const key = c.req.header("x-api-key");
  if (!key) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  await next();
}
