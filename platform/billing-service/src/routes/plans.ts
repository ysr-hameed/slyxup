import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { BillingEnv } from "@slyxup/shared";
import { apiResponseSchema } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq, isNull } from "drizzle-orm";

const route = new OpenAPIHono<{ Bindings: BillingEnv }>();

const routeDef = createRoute({
  method: "get",
  path: "/plans",
  summary: "List all active plans",
  tags: ["Billing"],
  request: { query: z.object({ platform: z.string().optional() }) },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.array(z.any())) } }, description: "List of plans" },
  },
});

route.openapi(routeDef, async (c) => {
  const { platform } = c.req.valid("query");
  const db = createDb(c.env.DB);
  const result = await db.select().from(schema.plans).where(
    platform ? eq(schema.plans.platform, platform) : isNull(schema.plans.deletedAt),
  ).all();
  return c.json({ success: true, data: result });
});

export default route;
