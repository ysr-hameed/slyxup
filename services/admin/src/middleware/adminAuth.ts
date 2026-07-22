import type { Context, Next } from "hono";
import type { AdminEnv } from "@slyxup/shared-types";
import { verifyToken } from "@slyxup/shared-utils";
import { createAdminDb, adminSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";

export async function adminAuthMiddleware(c: Context<{ Bindings: AdminEnv }>, next: Next) {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }
  const payload = await verifyToken(auth.slice(7), c.env.ADMIN_JWT_SECRET);
  if (!payload) {
    return c.json({ success: false, error: "Invalid or expired admin token" }, 401);
  }

  const db = createAdminDb(c.env.DB);
  const admin = await db
    .select()
    .from(adminSchema.adminUsers)
    .where(eq(adminSchema.adminUsers.id, payload.sub))
    .get();

  if (!admin) {
    return c.json({ success: false, error: "Admin not found" }, 401);
  }

  (c as any).set("adminId", admin.id);
  (c as any).set("adminEmail", admin.email);
  (c as any).set("adminRole", admin.role);
  await next();
}
