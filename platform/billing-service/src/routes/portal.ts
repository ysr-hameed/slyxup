import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { BillingEnv } from "@slyxup/shared";
import { apiResponseSchema, requireApiKey } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";

const route = new OpenAPIHono<{ Bindings: BillingEnv }>();

route.use("/create-portal", requireApiKey);

const routeDef = createRoute({
  method: "post",
  path: "/create-portal",
  summary: "Create a customer portal session",
  tags: ["Billing"],
  request: { body: { content: { "application/json": { schema: z.object({ user_id: z.string(), platform: z.string() }) } } } },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ url: z.string() })) } }, description: "Portal URL" },
    404: { description: "No active subscription" },
  },
});

route.openapi(routeDef, async (c) => {
  const { user_id } = c.req.valid("json");
  const db = createDb(c.env.DB);
  const sub = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, user_id)).get();
  if (!sub?.paddleCustomerId) return c.json({ success: false, error: "No active subscription found" }, 404);

  return c.json({ success: true, data: { url: `https://sandbox-portal.paddle.com/${sub.paddleCustomerId}` } });
});

export default route;
