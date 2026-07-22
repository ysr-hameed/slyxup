import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { PaymentEnv } from "@slyxup/shared-types";
import { apiResponseSchema, checkoutSchema } from "@slyxup/shared-utils";
import { getEnv } from "../services/paddle";

const route = new OpenAPIHono<{ Bindings: PaymentEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/checkout",
  summary: "Create a Paddle checkout transaction",
  tags: ["Payment"],
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
    502: { description: "Paddle API error" },
  },
});

route.openapi(routeDef, async (c) => {
  const { priceId, userId, platform, returnUrl } = c.req.valid("json");

  try {
    const { client } = getEnv(c);
    const transaction = await client.transactions.create({
      items: [{ priceId, quantity: 1 }],
      customData: { userId, platform: platform || "default" },
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
