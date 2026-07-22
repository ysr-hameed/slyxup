import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AdminEnv } from "@slyxup/shared";
import { apiResponseSchema } from "@slyxup/shared";
import { createAdminDb, adminSchema } from "@slyxup/database";

const route = new OpenAPIHono<{ Bindings: AdminEnv }>();

const routeDef = createRoute({
  method: "get",
  path: "/dashboard",
  summary: "Get admin dashboard stats",
  tags: ["Admin"],
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(z.any()) } },
      description: "Dashboard stats",
    },
  },
});

route.openapi(routeDef, async (c) => {
  const db = createAdminDb(c.env.DB);
  const totalAdmins = (await db.select().from(adminSchema.adminUsers).all()).length;
  const totalActions = (await db.select().from(adminSchema.auditLogs).all()).length;

  return c.json({
    success: true,
    data: { totalAdmins, totalActions },
  });
});

export default route;
