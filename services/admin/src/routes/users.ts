import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AdminEnv } from "@slyxup/shared-types";
import { generateId, apiResponseSchema } from "@slyxup/shared-utils";
import { createAdminDb, adminSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/shared-logger";
import { adminAuthMiddleware } from "../middleware/adminAuth";
import type { Context, Next } from "hono";

const route = new OpenAPIHono<{ Bindings: AdminEnv }>();

route.use("*", adminAuthMiddleware as (c: Context, next: Next) => Promise<Response | void>);

const listRoute = createRoute({
  method: "get",
  path: "/",
  summary: "List all admin users",
  tags: ["Admin"],
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Admin list" },
    401: { description: "Unauthorized" },
  },
});

route.openapi(listRoute, async (c) => {
  const db = createAdminDb(c.env.DB);
  const admins = await db.select().from(adminSchema.adminUsers).all();
  return c.json({ success: true, data: admins });
});

const getRoute = createRoute({
  method: "get",
  path: "/{id}",
  summary: "Get admin by ID",
  tags: ["Admin"],
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Admin details" },
    401: { description: "Unauthorized" },
    404: { description: "Admin not found" },
  },
});

route.openapi(getRoute, async (c) => {
  const { id } = c.req.valid("param");
  const db = createAdminDb(c.env.DB);
  const admin = await db.select().from(adminSchema.adminUsers).where(eq(adminSchema.adminUsers.id, id)).get();
  if (!admin) return c.json({ success: false, error: "Admin not found" }, 404);

  const { passwordHash, ...safe } = admin;
  return c.json({ success: true, data: safe });
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/{id}",
  summary: "Delete an admin",
  tags: ["Admin"],
  security: [{ Bearer: [] }],
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema() } }, description: "Admin deleted" },
    400: { description: "Cannot delete yourself" },
    401: { description: "Unauthorized" },
    403: { description: "Only superadmin can delete superadmin" },
    404: { description: "Admin not found" },
  },
});

route.openapi(deleteRoute, async (c) => {
  const { id } = c.req.valid("param");
  const adminId = (c as any).get("adminId");

  if (id === adminId)
    return c.json({ success: false, error: "Cannot delete yourself" }, 400);

  const db = createAdminDb(c.env.DB);
  const admin = await db.select().from(adminSchema.adminUsers).where(eq(adminSchema.adminUsers.id, id)).get();
  if (!admin) return c.json({ success: false, error: "Admin not found" }, 404);

  if (admin.role === "superadmin" && (c as any).get("adminRole") !== "superadmin")
    return c.json({ success: false, error: "Only superadmin can delete superadmin" }, 403);

  await db.delete(adminSchema.adminUsers).where(eq(adminSchema.adminUsers.id, id)).run();

  await db.insert(adminSchema.auditLogs).values({
    id: generateId(),
    adminId,
    action: "delete_admin",
    resource: "admin_user",
    resourceId: id,
    details: JSON.stringify({ email: admin.email }),
  }).run();

  logger.info("admin_deleted", { deletedBy: adminId, deletedId: id, email: admin.email });
  return c.json({ success: true });
});

export default route;
