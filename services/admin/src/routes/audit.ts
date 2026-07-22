import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AdminEnv } from "@slyxup/shared-types";
import { apiResponseSchema } from "@slyxup/shared-utils";
import { createAdminDb, adminSchema } from "@slyxup/shared-db";
import { desc, eq } from "drizzle-orm";
import { adminAuthMiddleware } from "../middleware/adminAuth";
import type { Context, Next } from "hono";

const route = new OpenAPIHono<{ Bindings: AdminEnv }>();

route.use("*", adminAuthMiddleware as (c: Context, next: Next) => Promise<Response | void>);

const listRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List audit logs",
  tags: ["Admin"],
  security: [{ Bearer: [] }],
  request: {
    query: z.object({ limit: z.coerce.number().optional() }),
  },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Audit logs" },
    401: { description: "Unauthorized" },
  },
});

route.openapi(listRoute, async (c) => {
  const db = createAdminDb(c.env.DB);
  const limit = Math.min(Number(c.req.valid("query").limit) || 50, 200);
  const logs = await db.select().from(adminSchema.auditLogs).orderBy(desc(adminSchema.auditLogs.createdAt)).limit(limit).all();
  return c.json({ success: true, data: logs });
});

const byAdminRoute = createRoute({
  method: "get",
  path: "/admin/{adminId}",
  summary: "Get audit logs for a specific admin",
  tags: ["Admin"],
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ adminId: z.string() }),
  },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Audit logs" },
    401: { description: "Unauthorized" },
  },
});

route.openapi(byAdminRoute, async (c) => {
  const { adminId } = c.req.valid("param");
  const db = createAdminDb(c.env.DB);
  const logs = await db.select().from(adminSchema.auditLogs).where(eq(adminSchema.auditLogs.adminId, adminId)).orderBy(desc(adminSchema.auditLogs.createdAt)).limit(50).all();
  return c.json({ success: true, data: logs });
});

export default route;
