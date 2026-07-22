import { Hono } from "hono";
import type { AdminEnv, ApiResponse } from "@slyxup/shared-types";
import { createAdminDb, adminSchema } from "@slyxup/shared-db";
import { desc, eq } from "drizzle-orm";
import { adminAuthMiddleware } from "../middleware/adminAuth";

const route = new Hono<{ Bindings: AdminEnv }>();

route.use("*", adminAuthMiddleware);

route.get("/", async (c) => {
  const db = createAdminDb(c.env.DB);
  const limit = Math.min(Number(c.req.query("limit")) || 50, 200);
  const logs = await db.select().from(adminSchema.auditLogs).orderBy(desc(adminSchema.auditLogs.createdAt)).limit(limit).all();
  return c.json<ApiResponse>({ success: true, data: logs });
});

route.get("/admin/:adminId", async (c) => {
  const adminId = c.req.param("adminId");
  const db = createAdminDb(c.env.DB);
  const logs = await db.select().from(adminSchema.auditLogs).where(eq(adminSchema.auditLogs.adminId, adminId)).orderBy(desc(adminSchema.auditLogs.createdAt)).limit(50).all();
  return c.json<ApiResponse>({ success: true, data: logs });
});

export default route;
