import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { BillingEnv } from "@slyxup/shared";
import { apiResponseSchema } from "@slyxup/shared";
import { createBillingDb, billingSchema } from "@slyxup/database";
import { eq, isNull } from "drizzle-orm";

const route = new OpenAPIHono<{ Bindings: BillingEnv }>();

const routeDef = createRoute({
  method: "get",
  path: "/plans",
  summary: "List all active plans",
  tags: ["Billing"],
  request: {
    query: z.object({ platform: z.string().optional() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(z.array(z.any())) } },
      description: "List of plans",
    },
  },
});

route.openapi(routeDef, async (c) => {
  const { platform } = c.req.valid("query");
  const db = createBillingDb(c.env.DB);
  const query = db.select().from(billingSchema.plans).where(
    platform ? eq(billingSchema.plans.platform, platform) : isNull(billingSchema.plans.deletedAt),
  );
  const result = await query.all();
  return c.json({ success: true, data: result });
});

export default route;
