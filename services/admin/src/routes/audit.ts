import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AdminEnv } from "@slyxup/shared";
import { apiResponseSchema, generateId } from "@slyxup/shared";
import { createAdminDb, adminSchema } from "@slyxup/database";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AdminEnv; Variables: { adminId: string } }>();

const listDef = createRoute({
  method: "get",
  path: "/audit-logs",
  summary: "List audit logs",
  tags: ["Admin"],
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(z.array(z.any())) } },
      description: "List of audit logs",
    },
  },
});

route.openapi(listDef, async (c) => {
  const db = createAdminDb(c.env.DB);
  const logs = await db.select().from(adminSchema.auditLogs).all();
  return c.json({ success: true, data: logs });
});

const createDef = createRoute({
  method: "post",
  path: "/audit-logs",
  summary: "Create an audit log entry",
  tags: ["Admin"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            action: z.string(), resource: z.string(),
            resource_id: z.string().optional(), details: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: { 200: { description: "Audit log created" } },
});

route.openapi(createDef, async (c) => {
  const { action, resource, resource_id, details } = c.req.valid("json");
  const adminId = c.get("adminId") || "system";
  const db = createAdminDb(c.env.DB);

  await db.insert(adminSchema.auditLogs).values({
    id: generateId(), adminId, action, resource,
    resourceId: resource_id ?? null, details: details ?? null,
    ip: c.req.header("CF-Connecting-IP") ?? null,
    createdAt: new Date().toISOString(),
  }).run();

  logger.info("audit_log_created", { action, resource, adminId });
  return c.json({ success: true });
});

export default route;
