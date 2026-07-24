import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { BillingEnv } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: BillingEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/webhook",
  summary: "Paddle webhook handler",
  tags: ["Billing"],
  responses: { 200: { description: "Webhook processed" } },
});

route.openapi(routeDef, async (c) => {
  const body = await c.req.json();
  const signature = c.req.header("Paddle-Signature") || "";

  const secret = c.env.PADDLE_WEBHOOK_SECRET;
  if (secret) {
    const encoder = new TextEncoder();
    const ts = signature.split(";")[0]?.replace("ts=", "") || "";
    const sig = signature.split(";")[1]?.replace("h1=", "") || "";
    const payload = `${ts}:${JSON.stringify(body)}`;
    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const valid = await crypto.subtle.verify("HMAC", key, hexToBytes(sig), encoder.encode(payload));
    if (!valid) {
      logger.warn("paddle_webhook_invalid_signature");
      return c.json({ success: false, error: "Invalid signature" }, 401);
    }
  }

  logger.info("paddle_webhook", { eventType: body.event_type });

  const db = createDb(c.env.DB);
  switch (body.event_type) {
    case "subscription.created":
    case "subscription.updated": {
      const sub = body.data;
      await db.insert(schema.subscriptions).values({
        id: sub.id,
        userId: sub.custom_data?.user_id || "",
        planId: sub.items?.[0]?.price?.id || "",
        platform: sub.custom_data?.platform || "",
        status: sub.status,
        currentPeriodStart: sub.current_billing_period?.starts_at || "",
        currentPeriodEnd: sub.current_billing_period?.ends_at || "",
        paddleSubscriptionId: sub.id,
        paddleCustomerId: sub.customer_id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).onConflictDoUpdate({
        target: schema.subscriptions.id,
        set: {
          status: sub.status,
          currentPeriodStart: sub.current_billing_period?.starts_at || "",
          currentPeriodEnd: sub.current_billing_period?.ends_at || "",
          updatedAt: new Date().toISOString(),
        },
      }).run();
      break;
    }
    case "transaction.completed": {
      const tx = body.data;
      await db.insert(schema.invoices).values({
        id: tx.id,
        subscriptionId: tx.subscription_id || "",
        userId: tx.custom_data?.user_id || "",
        platform: tx.custom_data?.platform || "",
        amount: tx.details?.totals?.total || "0",
        currency: tx.currency_code || "USD",
        status: "paid",
        paddleInvoiceId: tx.id,
        createdAt: new Date().toISOString(),
      }).run();
      break;
    }
  }

  return c.json({ success: true });
});

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export default route;
