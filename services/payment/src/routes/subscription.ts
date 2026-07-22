import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { PaymentEnv } from "@slyxup/shared-types";
import { apiResponseSchema } from "@slyxup/shared-utils";
import { createPaymentDb, paymentSchema } from "@slyxup/shared-db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

interface Variables {
  userId: string;
  userEmail: string;
  platform: string;
}

const route = new OpenAPIHono<{ Bindings: PaymentEnv; Variables: Variables }>();

route.use("/subscription", authMiddleware);

const routeDef = createRoute({
  method: "get",
  path: "/subscription",
  summary: "Get subscriptions for the authenticated user",
  tags: ["Payment"],
  security: [{ Bearer: [] }],
  request: {},
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(z.any()) } },
      description: "List of subscriptions",
    },
    401: { description: "Unauthorized" },
  },
});

route.openapi(routeDef, async (c) => {
  const userId = c.get("userId");
  const platform = c.get("platform");

  const db = createPaymentDb(c.env.DB);
  const subs = await db
    .select()
    .from(paymentSchema.subscriptions)
    .where(and(
      eq(paymentSchema.subscriptions.userId, userId),
      eq(paymentSchema.subscriptions.platform, platform),
    ))
    .all();

  return c.json({ success: true, data: subs });
});

export default route;
