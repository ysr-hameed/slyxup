import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { BillingEnv } from "@slyxup/shared";
import { apiResponseSchema } from "@slyxup/shared";
import { createBillingDb, billingSchema } from "@slyxup/database";
import { eq } from "drizzle-orm";

const route = new OpenAPIHono<{ Bindings: BillingEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/create-portal",
  summary: "Create a customer portal session",
  tags: ["Billing"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ user_id: z.string(), platform: z.string() }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(z.object({ url: z.string() })) } },
      description: "Portal URL",
    },
    404: { description: "No active subscription" },
  },
});

route.openapi(routeDef, async (c) => {
  const { user_id, platform } = c.req.valid("json");
  const db = createBillingDb(c.env.DB);

  const sub = await db.select().from(billingSchema.subscriptions).where(
    eq(billingSchema.subscriptions.userId, user_id),
  ).get();

  if (!sub?.paddleCustomerId) {
    return c.json({ success: false, error: "No active subscription found" }, 404);
  }

  return c.json({
    success: true,
    data: { url: `https://sandbox-portal.paddle.com/${sub.paddleCustomerId}` },
  });
});

export default route;
