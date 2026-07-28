import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { BillingEnv } from "@slyxup/shared";
import { apiResponseSchema, verifyToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";

const route = new OpenAPIHono<{ Bindings: BillingEnv }>();

const routeDef = createRoute({
  method: "get",
  path: "/subscription",
  summary: "Get active subscription for user",
  tags: ["Billing"],
  request: { query: z.object({ user_id: z.string().optional() }) },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Active subscription" },
    401: { description: "Unauthorized" },
    404: { description: "No active subscription" },
  },
});

route.openapi(routeDef, async (c) => {
  const auth = c.req.header("Authorization");
  let userId: string;

  if (auth?.startsWith("Bearer ")) {
    const payload = await verifyToken(auth.slice(7), c.env.JWT_SECRET);
    if (!payload) return c.json({ success: false, error: "Invalid or expired token" }, 401);
    userId = payload.sub;
  } else {
    const key = c.req.header("X-API-Key");
    if (!key || key !== c.env.API_KEY) return c.json({ success: false, error: "Invalid or missing API key" }, 401);
    const { user_id } = c.req.valid("query");
    if (!user_id) return c.json({ success: false, error: "Missing user_id" }, 400);
    userId = user_id;
  }

  const db = createDb(c.env.DB);
  const sub = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, userId)).get();
  if (!sub) return c.json({ success: false, error: "No subscription found" }, 404);
  return c.json({ success: true, data: sub });
});

export default route;
