import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { BillingEnv } from "@slyxup/shared";
import { createCheckoutSchema, apiResponseSchema, requireApiKey } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: BillingEnv }>();

route.use("/create-checkout", requireApiKey);

const routeDef = createRoute({
  method: "post",
  path: "/create-checkout",
  summary: "Create a checkout session",
  tags: ["Billing"],
  request: { body: { content: { "application/json": { schema: createCheckoutSchema } } } },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ url: z.string() })) } }, description: "Checkout URL" },
    404: { description: "Plan not found" },
  },
});

route.openapi(routeDef, async (c) => {
  const { plan_id, platform } = c.req.valid("json");
  const db = createDb(c.env.DB);
  const plan = await db.select().from(schema.plans).where(eq(schema.plans.id, plan_id)).get();
  if (!plan) return c.json({ success: false, error: "Plan not found" }, 404);

  const checkoutUrl = `https://sandbox-checkout.paddle.com/checkout/${plan.paddlePriceId}`;
  logger.info("checkout_created", { planId: plan_id, platform });

  return c.json({ success: true, data: { url: checkoutUrl } });
});

export default route;
