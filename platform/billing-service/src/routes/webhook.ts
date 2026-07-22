import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { BillingEnv } from "@slyxup/shared";
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
  logger.info("paddle_webhook", { eventType: body.event_type });
  return c.json({ success: true });
});

export default route;
