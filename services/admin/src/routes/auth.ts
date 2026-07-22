import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AdminEnv } from "@slyxup/shared-types";
import { hashPassword, verifyPassword, generateId, signToken, validateEmail, apiResponseSchema, adminRegisterSchema, adminLoginSchema } from "@slyxup/shared-utils";
import { createAdminDb, adminSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/shared-logger";

const route = new OpenAPIHono<{ Bindings: AdminEnv }>();

const loginRoute = createRoute({
  method: "post",
  path: "/login",
  summary: "Admin login",
  tags: ["Admin"],
  request: {
    body: { content: { "application/json": { schema: adminLoginSchema } } },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({
            jwt: z.string(),
            admin: z.object({ id: z.string(), email: z.string(), name: z.string().nullable(), role: z.string() }),
          })),
        },
      },
      description: "Login successful",
    },
    400: { description: "Missing fields" },
    401: { description: "Invalid credentials" },
  },
});

route.openapi(loginRoute, async (c) => {
  const { email, password } = c.req.valid("json");

  const db = createAdminDb(c.env.DB);
  const admin = await db
    .select()
    .from(adminSchema.adminUsers)
    .where(eq(adminSchema.adminUsers.email, email))
    .get();

  if (!admin || !(await verifyPassword(password, admin.passwordHash)))
    return c.json({ success: false, error: "Invalid email or password" }, 401);

  const jwt = await signToken(
    { sub: admin.id, email: admin.email },
    c.env.ADMIN_JWT_SECRET, 86400,
  );

  logger.info("admin_login", { adminId: admin.id, email: admin.email });

  return c.json({
    success: true,
    data: { jwt, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } },
  });
});

const registerRoute = createRoute({
  method: "post",
  path: "/register",
  summary: "Register a new admin",
  tags: ["Admin"],
  request: {
    body: { content: { "application/json": { schema: adminRegisterSchema } } },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({ adminId: z.string() })),
        },
      },
      description: "Admin registered",
    },
    400: { description: "Validation error" },
    403: { description: "Invalid secret" },
    409: { description: "Admin already exists" },
  },
});

route.openapi(registerRoute, async (c) => {
  const { email, password, name, secret } = c.req.valid("json");

  if (secret !== "superadmin-secret-2026")
    return c.json({ success: false, error: "Invalid registration secret" }, 403);

  if (!validateEmail(email))
    return c.json({ success: false, error: "Invalid email" }, 400);

  const db = createAdminDb(c.env.DB);
  const existing = await db
    .select({ id: adminSchema.adminUsers.id })
    .from(adminSchema.adminUsers)
    .where(eq(adminSchema.adminUsers.email, email))
    .get();

  if (existing)
    return c.json({ success: false, error: "Admin already exists" }, 409);

  const id = generateId();
  const passwordHash = await hashPassword(password);

  await db.insert(adminSchema.adminUsers).values({ id, email, name: name ?? null, passwordHash }).run();

  logger.info("admin_registered", { adminId: id, email });

  return c.json({ success: true, data: { adminId: id } }, 201);
});

export default route;
