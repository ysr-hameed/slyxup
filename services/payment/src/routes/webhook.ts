import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { PaymentEnv } from "@slyxup/shared-types";
import { apiResponseSchema } from "@slyxup/shared-utils";
import { createPaymentDb, paymentSchema } from "@slyxup/shared-db";
import { generateId } from "@slyxup/shared-utils";
import { eq } from "drizzle-orm";
import { getEnv } from "../services/paddle";

const route = new OpenAPIHono<{ Bindings: PaymentEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/webhook",
  summary: "Handle Paddle webhook events",
  tags: ["Payment"],
  request: {
    body: { content: { "application/json": { schema: z.any() } } },
    headers: z.object({
      "paddle-signature": z.string(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema() } },
      description: "Webhook processed",
    },
    400: { description: "Missing or invalid signature" },
  },
});

route.openapi(routeDef, async (c) => {
  const signature = c.req.header("paddle-signature");
  if (!signature) {
    return c.json({ success: false, error: "Missing paddle-signature" }, 400);
  }

  const rawBody = await c.req.text();
  const { client, secret } = getEnv(c);

  const event = client.webhooks.unmarshal(rawBody, secret, signature);
  if (!event) {
    return c.json({ success: false, error: "Invalid signature" }, 400);
  }

  const db = createPaymentDb(c.env.DB);
  const data = event.data as any;

  switch (event.eventType) {
    case "transaction.completed": {
      const userId = data.custom_data?.userId as string | undefined;
      const platform = (data.custom_data?.platform as string) || "default";
      if (!userId) break;

      await db.insert(paymentSchema.subscriptions).values({
        id: generateId(),
        userId,
        planId: data.items?.[0]?.price?.id ?? "unknown",
        platform,
        status: "active",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
        paddleSubscriptionId: data.subscription_id ?? null,
        paddleCustomerId: data.customer_id ?? null,
      }).run();
      break;
    }

    case "subscription.canceled": {
      await db
        .update(paymentSchema.subscriptions)
        .set({ status: "canceled", updatedAt: new Date().toISOString() })
        .where(eq(paymentSchema.subscriptions.paddleSubscriptionId, data.id))
        .run();
      break;
    }

    case "subscription.updated": {
      const status = data.status === "active" ? "active"
        : data.status === "past_due" ? "past_due"
        : "incomplete";

      await db
        .update(paymentSchema.subscriptions)
        .set({
          status,
          currentPeriodEnd: data.current_period_end
            ? new Date((data.current_period_end as any).seconds * 1000).toISOString()
            : undefined,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(paymentSchema.subscriptions.paddleSubscriptionId, data.id))
        .run();
      break;
    }
  }

  return c.json({ success: true });
});

export default route;
