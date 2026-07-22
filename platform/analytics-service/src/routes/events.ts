import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AnalyticsEnv } from "@slyxup/shared";
import { trackEventSchema, apiResponseSchema, generateId } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AnalyticsEnv }>();

const trackDef = createRoute({
  method: "post",
  path: "/event",
  summary: "Track a custom event",
  tags: ["Analytics"],
  request: { body: { content: { "application/json": { schema: trackEventSchema } } } },
  responses: { 200: { description: "Event tracked" } },
});

route.openapi(trackDef, async (c) => {
  const { name, user_id, platform, properties } = c.req.valid("json");
  const db = createDb(c.env.DB);
  await db.insert(schema.events).values({
    id: generateId(), name, userId: user_id ?? null, platform,
    properties: properties ? JSON.stringify(properties) : null,
    createdAt: new Date().toISOString(),
  }).run();
  logger.info("event_tracked", { name, platform, userId: user_id });
  return c.json({ success: true });
});

const listDef = createRoute({
  method: "get",
  path: "/events",
  summary: "List events",
  tags: ["Analytics"],
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.array(z.any())) } }, description: "List of events" },
  },
});

route.openapi(listDef, async (c) => {
  const db = createDb(c.env.DB);
  const results = await db.select().from(schema.events).all();
  return c.json({ success: true, data: results });
});

export default route;
