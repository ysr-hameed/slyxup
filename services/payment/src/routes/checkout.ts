import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Context } from "hono";
import type { PaymentEnv } from "@slyxup/shared-types";
import { apiResponseSchema, checkoutSchema } from "@slyxup/shared-utils";
import { getEnv } from "../services/paddle";
import { authMiddleware } from "../middleware/auth";

interface Variables {
  userId: string;
  userEmail: string;
  platform: string;
}

const route = new OpenAPIHono<{ Bindings: PaymentEnv; Variables: Variables }>();

route.use("/checkout", authMiddleware);

const routeDef = createRoute({
  method: "post",
  path: "/checkout",
  summary: "Create a Paddle checkout transaction",
  tags: ["Payment"],
  security: [{ Bearer: [] }],
  request: {
    body: { content: { "application/json": { schema: checkoutSchema } } },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({ transactionId: z.string() })),
        },
      },
      description: "Checkout created",
    },
    400: { description: "Missing required fields" },
    401: { description: "Unauthorized" },
    502: { description: "Paddle API error" },
  },
});

route.openapi(routeDef, async (c) => {
  const { priceId, returnUrl } = c.req.valid("json");
  const userId = c.get("userId");
  const platform = c.get("platform");

  try {
    const { client } = getEnv(c);
    const transaction = await client.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { userId, platform },
      ...(returnUrl ? { returnUrl } : {}),
    });

    return c.json({
      success: true,
      data: { transactionId: transaction.id },
    });
  } catch (err) {
    console.error("Paddle checkout error:", err);
    return c.json({ success: false, error: "Failed to create checkout" }, 502);
  }
});

export default route;
