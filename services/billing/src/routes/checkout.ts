import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { BillingEnv } from "@slyxup/shared";
import { createCheckoutSchema, apiResponseSchema } from "@slyxup/shared";
import { createBillingDb, billingSchema } from "@slyxup/database";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: BillingEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/create-checkout",
  summary: "Create a checkout session",
  tags: ["Billing"],
  request: {
    body: { content: { "application/json": { schema: createCheckoutSchema } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(z.object({ url: z.string() })) } },
      description: "Checkout URL",
    },
    400: { description: "Invalid request" },
    404: { description: "Plan not found" },
  },
});

route.openapi(routeDef, async (c) => {
  const { plan_id, user_id, platform, success_url, cancel_url } = c.req.valid("json");

  const db = createBillingDb(c.env.DB);
  const plan = await db.select().from(billingSchema.plans).where(eq(billingSchema.plans.id, plan_id)).get();
  if (!plan) {
    return c.json({ success: false, error: "Plan not found" }, 404);
  }

  // Paddle checkout generation
  const checkoutUrl = `https://sandbox-checkout.paddle.com/checkout/${plan.paddlePriceId}`;

  logger.info("checkout_created", { userId: user_id, planId: plan_id, platform });

  return c.json({
    success: true,
    data: { url: checkoutUrl },
  });
});

export default route;
