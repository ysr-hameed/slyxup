import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { NotificationEnv } from "@slyxup/shared";
import { apiResponseSchema, generateId, requireApiKey } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { desc } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: NotificationEnv }>();

route.use("/send", requireApiKey);
route.use("/logs", requireApiKey);

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
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Notification sent" },
    500: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Failed to send" },
  },
});

route.openapi(sendDef, async (c) => {
  const { user_id, channel, to_address, subject, body } = c.req.valid("json");
  const db = createDb(c.env.DB);

  let status = "sent";
  let errorMsg: string | null = null;

  if (channel === "email") {
    try {
      const emailApiKey = c.env.EMAIL_API_KEY;
      const emailBaseUrl = c.env.EMAIL_SERVICE_URL ?? "http://localhost:8002";

      if (emailApiKey) {
        const res = await fetch(`${emailBaseUrl}/api/email/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-API-Key": emailApiKey },
          body: JSON.stringify({ to: [to_address], subject: subject ?? "", html: body }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error((errBody as any).error ?? `Email service returned ${res.status}`);
        }
        logger.info("notification_email_forwarded", { userId: user_id, to: to_address });
      } else {
        logger.info("notification_email_no_api_key", { userId: user_id, to: to_address, subject, body });
      }
    } catch (err) {
      status = "failed";
      errorMsg = err instanceof Error ? err.message : "Unknown error";
      logger.error("notification_email_failed", { userId: user_id, to: to_address, error: errorMsg });
    }
  }

  const log = {
    id: generateId(), userId: user_id, channel, toAddress: to_address,
    subject: subject ?? null, status, sentAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  await db.insert(schema.notificationLogs).values(log).run();
  logger.info("notification_logged", { userId: user_id, channel, status });

  if (status === "failed") {
    return c.json({ success: false, error: errorMsg ?? "Failed to send notification" }, 500);
  }
  return c.json({ success: true, data: log });
});

const listDef = createRoute({
  method: "get",
  path: "/logs",
  summary: "List notification logs with pagination",
  tags: ["Notification"],
  request: {
    query: z.object({
      limit: z.coerce.number().optional().default(50),
      offset: z.coerce.number().optional().default(0),
    }),
  },
  responses: { 200: { content: { "application/json": { schema: apiResponseSchema(z.array(z.any())) } }, description: "Paginated logs" } },
});

route.openapi(listDef, async (c) => {
  const { limit, offset } = c.req.valid("query");
  const db = createDb(c.env.DB);
  const logs = await db.select().from(schema.notificationLogs)
    .orderBy(desc(schema.notificationLogs.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
  return c.json({ success: true, data: logs });
});

export default route;
