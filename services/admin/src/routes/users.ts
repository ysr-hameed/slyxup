import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AdminEnv } from "@slyxup/shared";
import { apiResponseSchema } from "@slyxup/shared";
import { createAdminDb, adminSchema } from "@slyxup/database";
import { generateId, hashPassword } from "@slyxup/shared";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AdminEnv }>();

const listDef = createRoute({
  method: "get",
  path: "/users",
  summary: "List admin users",
  tags: ["Admin"],
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(z.array(z.any())) } },
      description: "List of admin users",
    },
  },
});

route.openapi(listDef, async (c) => {
  const db = createAdminDb(c.env.DB);
  const users = await db.select({
    id: adminSchema.adminUsers.id, email: adminSchema.adminUsers.email,
    name: adminSchema.adminUsers.name, role: adminSchema.adminUsers.role,
    createdAt: adminSchema.adminUsers.createdAt,
  }).from(adminSchema.adminUsers).all();
  return c.json({ success: true, data: users });
});

const createDef = createRoute({
  method: "post",
  path: "/users",
  summary: "Create an admin user",
  tags: ["Admin"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ email: z.string().email(), name: z.string(), password: z.string() }),
        },
      },
    },
  },
  responses: { 201: { description: "Admin user created" } },
});

route.openapi(createDef, async (c) => {
  const { email, name, password } = c.req.valid("json");
  const db = createAdminDb(c.env.DB);

  const passwordHash = await hashPassword(password);
  await db.insert(adminSchema.adminUsers).values({
    id: generateId(), email, name, passwordHash, role: "admin",
    createdAt: new Date().toISOString(),
  }).run();

  logger.info("admin_user_created", { email });
  return c.json({ success: true, data: { email, name } }, 201);
});

export default route;
