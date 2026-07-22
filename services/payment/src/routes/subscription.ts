import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { PaymentEnv } from "@slyxup/shared-types";
import { apiResponseSchema } from "@slyxup/shared-utils";
import { createPaymentDb, paymentSchema } from "@slyxup/shared-db";
import { eq, and } from "drizzle-orm";

const route = new OpenAPIHono<{ Bindings: PaymentEnv }>();

const routeDef = createRoute({
  method: "get",
  path: "/subscription",
  summary: "Get subscriptions by userId and platform",
  tags: ["Payment"],
  request: {
    query: z.object({
      userId: z.string(),
      platform: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(z.any()) } },
      description: "List of subscriptions",
    },
    400: { description: "userId is required" },
  },
});

route.openapi(routeDef, async (c) => {
  const { userId, platform } = c.req.valid("query");

  const db = createPaymentDb(c.env.DB);
  const subs = await db
    .select()
    .from(paymentSchema.subscriptions)
    .where(and(
      eq(paymentSchema.subscriptions.userId, userId),
      eq(paymentSchema.subscriptions.platform, platform || "default"),
    ))
    .all();

  return c.json({ success: true, data: subs });
});

export default route;
