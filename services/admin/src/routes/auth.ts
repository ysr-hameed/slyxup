import { Hono } from "hono";
import type { AdminEnv, ApiResponse } from "@slyxup/shared-types";
import { hashPassword, verifyPassword, generateId, signToken, validateEmail } from "@slyxup/shared-utils";
import { createAdminDb, adminSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/shared-logger";

const route = new Hono<{ Bindings: AdminEnv }>();

route.post("/login", async (c) => {
  let body: { email?: string; password?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json<ApiResponse>({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { email, password } = body;
  if (!email || !password)
    return c.json<ApiResponse>({ success: false, error: "Email and password are required" }, 400);

  const db = createAdminDb(c.env.DB);
  const admin = await db
    .select()
    .from(adminSchema.adminUsers)
    .where(eq(adminSchema.adminUsers.email, email))
    .get();

  if (!admin || !(await verifyPassword(password, admin.passwordHash)))
    return c.json<ApiResponse>({ success: false, error: "Invalid email or password" }, 401);

  const jwt = await signToken(
    { sub: admin.id, email: admin.email },
    c.env.ADMIN_JWT_SECRET,
    86400,
  );

  logger.info("admin_login", { adminId: admin.id, email: admin.email });

  return c.json<ApiResponse<{ jwt: string; admin: { id: string; email: string; name: string | null; role: string } }>>({
    success: true,
    data: { jwt, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } },
  });
});

route.post("/register", async (c) => {
  let body: { email?: string; password?: string; name?: string; secret?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json<ApiResponse>({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { email, password, name, secret } = body;
  if (secret !== "superadmin-secret-2026")
    return c.json<ApiResponse>({ success: false, error: "Invalid registration secret" }, 403);

  if (!email || !password)
    return c.json<ApiResponse>({ success: false, error: "Email and password are required" }, 400);

  if (!validateEmail(email))
    return c.json<ApiResponse>({ success: false, error: "Invalid email" }, 400);

  if (password.length < 8)
    return c.json<ApiResponse>({ success: false, error: "Min 8 characters" }, 400);

  const db = createAdminDb(c.env.DB);
  const existing = await db
    .select({ id: adminSchema.adminUsers.id })
    .from(adminSchema.adminUsers)
    .where(eq(adminSchema.adminUsers.email, email))
    .get();

  if (existing)
    return c.json<ApiResponse>({ success: false, error: "Admin already exists" }, 409);

  const id = generateId();
  const passwordHash = await hashPassword(password);

  await db.insert(adminSchema.adminUsers).values({ id, email, name: name ?? null, passwordHash }).run();

  logger.info("admin_registered", { adminId: id, email });

  return c.json<ApiResponse<{ adminId: string }>>({ success: true, data: { adminId: id } }, 201);
});

export default route;
