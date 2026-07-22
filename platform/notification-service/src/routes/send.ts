import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { NotificationEnv } from "@slyxup/shared";
import { apiResponseSchema, generateId } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: NotificationEnv }>();

const sendDef = createRoute({
  method: "post",
  path: "/send",
  summary: "Send a notification",
  tags: ["Notification"],
  request: {
    body: { content: { "application/json": { schema: z.object({
      user_id: z.string(), channel: z.enum(["email", "sms", "push"]),
      to_address: z.string(), subject: z.string().optional(), body: z.string(),
    }) } } },
  },
  responses: { 200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Notification sent" } },
});

route.openapi(sendDef, async (c) => {
  const { user_id, channel, to_address, subject, body } = c.req.valid("json");
  const db = createDb(c.env.DB);
  const log = {
    id: generateId(), userId: user_id, channel, toAddress: to_address,
    subject: subject ?? null, status: "sent", sentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  await db.insert(schema.notificationLogs).values(log).run();
  logger.info("notification_sent", { userId: user_id, channel, to: to_address });
  return c.json({ success: true, data: log });
});

const listDef = createRoute({
  method: "get",
  path: "/logs",
  summary: "List notification logs",
  tags: ["Notification"],
  responses: { 200: { content: { "application/json": { schema: apiResponseSchema(z.array(z.any())) } }, description: "List of logs" } },
});

route.openapi(listDef, async (c) => {
  const db = createDb(c.env.DB);
  const logs = await db.select().from(schema.notificationLogs).all();
  return c.json({ success: true, data: logs });
});

export default route;
