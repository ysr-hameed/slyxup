import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AnalyticsEnv } from "@slyxup/shared";
import { apiResponseSchema, generateId, requireApiKey } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AnalyticsEnv }>();

route.use("/summary", requireApiKey);

const trackDef = createRoute({
  method: "post",
  path: "/pageview",
  summary: "Track a page view",
  tags: ["Analytics"],
  request: { body: { content: { "application/json": { schema: z.object({ path: z.string(), platform: z.string(), user_id: z.string().optional(), referrer: z.string().optional() }) } } } },
  responses: { 200: { description: "Page view tracked" } },
});

route.openapi(trackDef, async (c) => {
  const { path: pagePath, platform, user_id, referrer } = c.req.valid("json");
  const db = createDb(c.env.DB);
  await db.insert(schema.pageViews).values({
    id: generateId(), path: pagePath, userId: user_id ?? null, platform,
    referrer: referrer ?? null, createdAt: new Date().toISOString(),
  }).run();
  logger.info("pageview_tracked", { path: pagePath, platform });
  return c.json({ success: true });
});

const summaryDef = createRoute({
  method: "get",
  path: "/summary",
  summary: "Get analytics summary",
  tags: ["Analytics"],
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Summary data" },
  },
});

route.openapi(summaryDef, async (c) => {
  const db = createDb(c.env.DB);
  const totalEvents = (await db.select().from(schema.pageViews).all()).length;
  return c.json({ success: true, data: { totalPageViews: totalEvents } });
});

export default route;
