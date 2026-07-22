import { Hono } from "hono";
import type { AdminEnv, ApiResponse } from "@slyxup/shared-types";
import { generateId } from "@slyxup/shared-utils";
import { createAdminDb, adminSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/shared-logger";
import { adminAuthMiddleware } from "../middleware/adminAuth";

const route = new Hono<{ Bindings: AdminEnv }>();

route.use("*", adminAuthMiddleware);

route.get("/", async (c) => {
  const db = createAdminDb(c.env.DB);
  const admins = await db.select().from(adminSchema.adminUsers).all();
  return c.json<ApiResponse>({ success: true, data: admins });
});

route.get("/:id", async (c) => {
  const id = c.req.param("id");
  const db = createAdminDb(c.env.DB);
  const admin = await db.select().from(adminSchema.adminUsers).where(eq(adminSchema.adminUsers.id, id)).get();
  if (!admin) return c.json<ApiResponse>({ success: false, error: "Admin not found" }, 404);

  const { passwordHash, ...safe } = admin;
  return c.json<ApiResponse>({ success: true, data: safe });
});

route.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const adminId = (c as any).get("adminId");

  if (id === adminId)
    return c.json<ApiResponse>({ success: false, error: "Cannot delete yourself" }, 400);

  const db = createAdminDb(c.env.DB);
  const admin = await db.select().from(adminSchema.adminUsers).where(eq(adminSchema.adminUsers.id, id)).get();
  if (!admin) return c.json<ApiResponse>({ success: false, error: "Admin not found" }, 404);

  if (admin.role === "superadmin" && (c as any).get("adminRole") !== "superadmin")
    return c.json<ApiResponse>({ success: false, error: "Only superadmin can delete superadmin" }, 403);

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
  return c.json<ApiResponse>({ success: true });
});

export default route;
