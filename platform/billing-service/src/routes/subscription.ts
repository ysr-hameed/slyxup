import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { BillingEnv } from "@slyxup/shared";
import { apiResponseSchema, requireApiKey } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";

const route = new OpenAPIHono<{ Bindings: BillingEnv }>();

route.use("/subscription", requireApiKey);

const routeDef = createRoute({
  method: "get",
  path: "/subscription",
  summary: "Get active subscription for user",
  tags: ["Billing"],
  request: { query: z.object({ user_id: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Active subscription" },
    404: { description: "No active subscription" },
  },
});

route.openapi(routeDef, async (c) => {
  const { user_id } = c.req.valid("query");
  const db = createDb(c.env.DB);
  const sub = await db.select().from(schema.subscriptions).where(eq(schema.subscriptions.userId, user_id)).get();
  if (!sub) return c.json({ success: false, error: "No subscription found" }, 404);
  return c.json({ success: true, data: sub });
});

export default route;
