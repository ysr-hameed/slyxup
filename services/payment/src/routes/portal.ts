import { Hono } from "hono";
import type { PaymentEnv, ApiResponse } from "@slyxup/shared-types";

const route = new Hono<{ Bindings: PaymentEnv }>();

route.post("/portal", async (c) => {
  let body: { customerId?: string; returnUrl?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json<ApiResponse>({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { customerId, returnUrl } = body;
  if (!customerId) {
    return c.json<ApiResponse>({ success: false, error: "customerId is required" }, 400);
  }

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
      return c.json<ApiResponse>({ success: false, error: "Failed to create portal session" }, 502);
    }

    const data = await resp.json() as any;
    return c.json<ApiResponse<{ url: string }>>({
      success: true,
      data: { url: data?.data?.urls?.general?.url ?? "" },
    });
  } catch (err) {
    console.error("Paddle portal error:", err);
    return c.json<ApiResponse>({ success: false, error: "Failed to create portal session" }, 502);
  }
});

export default route;
