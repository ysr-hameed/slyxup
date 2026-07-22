import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { BillingEnv } from "@slyxup/shared";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: BillingEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/webhook",
  summary: "Paddle webhook handler",
  tags: ["Billing"],
  responses: {
    200: { description: "Webhook processed" },
  },
});

route.openapi(routeDef, async (c) => {
  const body = await c.req.json();
  logger.info("paddle_webhook", { eventType: body.event_type });

  switch (body.event_type) {
    case "subscription.created":
      logger.info("subscription_created", { data: body.data });
      break;
    case "subscription.updated":
      logger.info("subscription_updated", { data: body.data });
      break;
    case "subscription.cancelled":
      logger.info("subscription_cancelled", { data: body.data });
      break;
    case "transaction.completed":
      logger.info("transaction_completed", { data: body.data });
      break;
    default:
      logger.debug("unhandled_webhook_event", { eventType: body.event_type });
  }

  return c.json({ success: true });
});

export default route;
