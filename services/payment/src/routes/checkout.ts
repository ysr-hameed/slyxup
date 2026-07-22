import { Hono } from "hono";
import type { PaymentEnv, ApiResponse } from "@slyxup/shared-types";
import { getEnv } from "../services/paddle";

const route = new Hono<{ Bindings: PaymentEnv }>();

route.post("/checkout", async (c) => {
  let body: { priceId?: string; userId?: string; returnUrl?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json<ApiResponse>({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { priceId, userId, returnUrl } = body;

  if (!priceId || !userId) {
    return c.json<ApiResponse>({ success: false, error: "priceId and userId are required" }, 400);
  }

  try {
    const { client } = getEnv(c);
    const transaction = await client.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { userId },
      ...(returnUrl ? { returnUrl } : {}),
    });

    return c.json<ApiResponse<{ transactionId: string }>>({
      success: true,
      data: { transactionId: transaction.id },
    });
  } catch (err) {
    console.error("Paddle checkout error:", err);
    return c.json<ApiResponse>({ success: false, error: "Failed to create checkout" }, 502);
  }
});

export default route;
