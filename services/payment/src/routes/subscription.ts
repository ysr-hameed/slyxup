import { Hono } from "hono";
import type { PaymentEnv, ApiResponse } from "@slyxup/shared-types";
import { createPaymentDb, paymentSchema } from "@slyxup/shared-db";
import { eq, and } from "drizzle-orm";

const route = new Hono<{ Bindings: PaymentEnv }>();

route.get("/subscription", async (c) => {
  const userId = c.req.query("userId");
  const platform = c.req.query("platform") || "default";
  if (!userId) {
    return c.json<ApiResponse>({ success: false, error: "userId is required" }, 400);
  }

  const db = createPaymentDb(c.env.DB);
  const subs = await db
    .select()
    .from(paymentSchema.subscriptions)
    .where(and(
      eq(paymentSchema.subscriptions.userId, userId),
      eq(paymentSchema.subscriptions.platform, platform),
    ))
    .all();

  return c.json<ApiResponse>({ success: true, data: subs });
});

export default route;
