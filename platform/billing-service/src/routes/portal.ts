import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { BillingEnv } from "@slyxup/shared";
import { apiResponseSchema, verifyToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";

const route = new OpenAPIHono<{ Bindings: BillingEnv }>();

const portalBodySchema = z.object({ user_id: z.string(), platform: z.string() });

const routeDef = createRoute({
  method: "post",
  path: "/create-portal",
  summary: "Create a customer portal session",
  tags: ["Billing"],
  request: { body: { content: { "application/json": { schema: portalBodySchema } } } },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ url: z.string() })) } }, description: "Portal URL" },
    401: { description: "Unauthorized" },
    404: { description: "No active subscription" },
  },
});

route.openapi(routeDef, async (c) => {
  const { user_id, platform } = c.req.valid("json");
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
  const sub = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, userId)).get();
  if (!sub?.paddleCustomerId) return c.json({ success: false, error: "No active subscription found" }, 404);

  const paddleDomain = c.env.PADDLE_URL_MODE === "production" ? "portal.paddle.com" : "sandbox-portal.paddle.com";
  return c.json({ success: true, data: { url: `https://${paddleDomain}/${sub.paddleCustomerId}` } });
});

export default route;
