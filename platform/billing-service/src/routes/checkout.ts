import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { BillingEnv } from "@slyxup/shared";
import { createCheckoutSchema, apiResponseSchema, verifyToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: BillingEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/create-checkout",
  summary: "Create a checkout session",
  tags: ["Billing"],
  request: { body: { content: { "application/json": { schema: createCheckoutSchema } } } },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ url: z.string() })) } }, description: "Checkout URL" },
    401: { description: "Unauthorized" },
    404: { description: "Plan not found" },
  },
});

route.openapi(routeDef, async (c) => {
  const { plan_id, platform, success_url, cancel_url, user_id } = c.req.valid("json");
  let userId: string;

  const auth = c.req.header("Authorization");
  if (auth?.startsWith("Bearer ")) {
    const payload = await verifyToken(auth.slice(7), c.env.JWT_SECRET);
    if (!payload) return c.json({ success: false, error: "Invalid or expired token" }, 401);
    userId = payload.sub;
  } else {
    const key = c.req.header("X-API-Key");
    if (!key || key !== c.env.API_KEY) return c.json({ success: false, error: "Invalid or missing API key" }, 401);
    userId = user_id;
  }

  const db = createDb(c.env.DB);
  const plan = await db.select().from(schema.plans).where(eq(schema.plans.id, plan_id)).get();
  if (!plan) return c.json({ success: false, error: "Plan not found" }, 404);
  if (!plan.paddlePriceId) return c.json({ success: false, error: "Plan not available for checkout" }, 400);

  const paddleDomain = c.env.PADDLE_URL_MODE === "production" ? "checkout.paddle.com" : "sandbox-checkout.paddle.com";
  const checkoutUrl = `https://${paddleDomain}/checkout/${plan.paddlePriceId}`;
  logger.info("checkout_created", { planId: plan_id, platform, userId });

  return c.json({ success: true, data: { url: checkoutUrl } });
});

export default route;
