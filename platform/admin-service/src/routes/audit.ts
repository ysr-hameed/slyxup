import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AdminEnv } from "@slyxup/shared";
import { apiResponseSchema, generateId, requireAdminKey } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AdminEnv }>();

route.use("*", requireAdminKey);

const listDef = createRoute({
  method: "get",
  path: "/audit-logs",
  summary: "List audit logs",
  tags: ["Admin"],
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.array(z.any())) } }, description: "List of audit logs" },
  },
});

route.openapi(listDef, async (c) => {
  const db = createDb(c.env.DB);
  const logs = await db.select().from(schema.auditLogs).all();
  return c.json({ success: true, data: logs });
});

const createDef = createRoute({
  method: "post",
  path: "/audit-logs",
  summary: "Create an audit log entry",
  tags: ["Admin"],
  request: {
    body: { content: { "application/json": { schema: z.object({ admin_id: z.string(), action: z.string(), resource: z.string(), details: z.string().optional(), platform: z.string().optional() }) } } },
  },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Audit log created" },
  },
});

route.openapi(createDef, async (c) => {
  const { admin_id, action, resource, details, platform } = c.req.valid("json");
  const db = createDb(c.env.DB);
  const log = { id: generateId(), adminId: admin_id, action, resource, details: details ?? null, platform: platform ?? null, createdAt: new Date().toISOString() };
  await db.insert(schema.auditLogs).values(log).run();
  logger.info("audit_log_created", { action, resource, adminId: admin_id });
  return c.json({ success: true, data: log });
});

export default route;
