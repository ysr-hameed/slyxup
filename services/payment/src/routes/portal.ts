import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { PaymentEnv } from "@slyxup/shared-types";
import { apiResponseSchema, portalSchema } from "@slyxup/shared-utils";

const route = new OpenAPIHono<{ Bindings: PaymentEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/portal",
  summary: "Create a Paddle customer portal session",
  tags: ["Payment"],
  request: {
    body: { content: { "application/json": { schema: portalSchema } } },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({ url: z.string() })),
        },
      },
      description: "Portal URL created",
    },
    400: { description: "customerId is required" },
    502: { description: "Paddle API error" },
  },
});

route.openapi(routeDef, async (c) => {
  const { customerId, returnUrl } = c.req.valid("json");

  try {
    const isSandbox = c.env.PADDLE_ENVIRONMENT === "sandbox";
    const url = `https://${isSandbox ? "sandbox-" : ""}api.paddle.com/customer-sessions`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${c.env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_id: customerId,
        ...(returnUrl ? { return_url: returnUrl } : {}),
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Paddle portal error:", resp.status, errText);
      return c.json({ success: false, error: "Failed to create portal session" }, 502);
    }

    const data = await resp.json() as any;
    return c.json({
      success: true,
      data: { url: data?.data?.urls?.general?.url ?? "" },
    });
  } catch (err) {
    console.error("Paddle portal error:", err);
    return c.json({ success: false, error: "Failed to create portal session" }, 502);
  }
});

export default route;
