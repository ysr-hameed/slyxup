import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AdminEnv } from "@slyxup/shared";
import { apiResponseSchema, generateId, requireAdminKey } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AdminEnv }>();

route.use("*", requireAdminKey);

const listDef = createRoute({
  method: "get",
  path: "/users",
  summary: "List admin users",
  tags: ["Admin"],
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.array(z.any())) } }, description: "List of admin users" },
  },
});

route.openapi(listDef, async (c) => {
  const db = createDb(c.env.DB);
  const users = await db.select().from(schema.adminUsers).all();
  return c.json({ success: true, data: users });
});

const createDef = createRoute({
  method: "post",
  path: "/users",
  summary: "Create an admin user",
  tags: ["Admin"],
  request: {
    body: { content: { "application/json": { schema: z.object({ email: z.string().email(), name: z.string(), role: z.string().optional() }) } } },
  },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Admin user created" },
  },
});

route.openapi(createDef, async (c) => {
  const { email, name, role } = c.req.valid("json");
  const db = createDb(c.env.DB);
  const user = { id: generateId(), email, name, role: role ?? "admin", createdAt: new Date().toISOString() };
  await db.insert(schema.adminUsers).values(user).run();
  logger.info("admin_user_created", { email, role: user.role });
  return c.json({ success: true, data: user });
});

const dashboardDef = createRoute({
  method: "get",
  path: "/dashboard",
  summary: "Get dashboard stats",
  tags: ["Admin"],
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.any()) } }, description: "Dashboard stats" },
  },
});

route.openapi(dashboardDef, async (c) => {
  const db = createDb(c.env.DB);
  const userCount = (await db.select().from(schema.adminUsers).all()).length;
  const logCount = (await db.select().from(schema.auditLogs).all()).length;
  return c.json({ success: true, data: { adminUsers: userCount, auditLogs: logCount } });
});

export default route;
