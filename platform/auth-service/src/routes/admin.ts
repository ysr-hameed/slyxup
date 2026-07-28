import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema, generateId } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

function adminGuard(c: any): Response | null {
  const key = c.req.header("X-Admin-Key");
  if (!key || key !== c.env?.ADMIN_KEY) {
    return c.json({ success: false, error: "Invalid or missing admin key" }, 401);
  }
  return null;
}

const listUsersDef = createRoute({
  method: "get",
  path: "/admin/users",
  summary: "List all users (admin)",
  tags: ["Admin"],
  responses: {
    200: { description: "User list" },
    401: { description: "Unauthorized" },
  },
});

const getUserDef = createRoute({
  method: "get",
  path: "/admin/users/{id}",
  summary: "Get user details (admin)",
  tags: ["Admin"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "User details" },
    401: { description: "Unauthorized" },
    404: { description: "Not found" },
  },
});

const suspendDef = createRoute({
  method: "post",
  path: "/admin/users/{id}/suspend",
  summary: "Suspend a user (admin)",
  tags: ["Admin"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "User suspended" },
    401: { description: "Unauthorized" },
  },
});

const unsuspendDef = createRoute({
  method: "post",
  path: "/admin/users/{id}/unsuspend",
  summary: "Unsuspend a user (admin)",
  tags: ["Admin"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "User unsuspended" },
    401: { description: "Unauthorized" },
  },
});

const forceLogoutDef = createRoute({
  method: "post",
  path: "/admin/users/{id}/force-logout",
  summary: "Revoke all sessions for a user (admin)",
  tags: ["Admin"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { description: "All sessions revoked" },
    401: { description: "Unauthorized" },
  },
});

const auditLogsDef = createRoute({
  method: "get",
  path: "/admin/audit-logs",
  summary: "List audit logs (admin)",
  tags: ["Admin"],
  request: {
    query: z.object({
      userId: z.string().optional(),
      limit: z.coerce.number().optional().default(50),
      offset: z.coerce.number().optional().default(0),
    }),
  },
  responses: {
    200: { description: "Audit logs" },
    401: { description: "Unauthorized" },
  },
});

route.openapi(listUsersDef, async (c) => {
  const guard = adminGuard(c);
  if (guard) return guard;
  const db = createDb(c.env.DB);
  const users = await db.select({
    id: schema.users.id,
    email: schema.users.email,
    name: schema.users.name,
    blocked: schema.users.blocked,
    emailVerified: schema.users.emailVerified,
    createdAt: schema.users.createdAt,
    deletedAt: schema.users.deletedAt,
  }).from(schema.users).orderBy(schema.users.createdAt).all();

  return c.json({ success: true, data: users });
});

route.openapi(getUserDef, async (c) => {
  const guard = adminGuard(c);
  if (guard) return guard;
  const { id } = c.req.valid("param");
  const db = createDb(c.env.DB);
  const user = await db.select({
    id: schema.users.id,
    email: schema.users.email,
    name: schema.users.name,
    blocked: schema.users.blocked,
    emailVerified: schema.users.emailVerified,
    createdAt: schema.users.createdAt,
    deletedAt: schema.users.deletedAt,
  }).from(schema.users).where(eq(schema.users.id, id)).get();

  if (!user) return c.json({ success: false, error: "User not found" }, 404);

  const sessions = await db.select({
    id: schema.sessions.id,
    ip: schema.sessions.ip,
    userAgent: schema.sessions.userAgent,
    lastSeen: schema.sessions.lastSeen,
    createdAt: schema.sessions.createdAt,
  }).from(schema.sessions)
    .where(eq(schema.sessions.userId, id))
    .all();

  return c.json({ success: true, data: { ...user, sessions } });
});

route.openapi(suspendDef, async (c) => {
  const guard = adminGuard(c);
  if (guard) return guard;
  const { id } = c.req.valid("param");
  const db = createDb(c.env.DB);
  await db.update(schema.users).set({ blocked: 1, updatedAt: new Date().toISOString() })
    .where(eq(schema.users.id, id)).run();
  logger.info("user_suspended_by_admin", { userId: id });
  return c.json({ success: true, data: { message: "User suspended" } });
});

route.openapi(unsuspendDef, async (c) => {
  const guard = adminGuard(c);
  if (guard) return guard;
  const { id } = c.req.valid("param");
  const db = createDb(c.env.DB);
  await db.update(schema.users).set({ blocked: 0, updatedAt: new Date().toISOString() })
    .where(eq(schema.users.id, id)).run();
  logger.info("user_unsuspended_by_admin", { userId: id });
  return c.json({ success: true, data: { message: "User unsuspended" } });
});

route.openapi(forceLogoutDef, async (c) => {
  const guard = adminGuard(c);
  if (guard) return guard;
  const { id } = c.req.valid("param");
  const db = createDb(c.env.DB);
  await db.update(schema.sessions).set({ revokedAt: new Date().toISOString() })
    .where(eq(schema.sessions.userId, id)).run();
  logger.info("user_force_logout_by_admin", { userId: id });
  return c.json({ success: true, data: { message: "All sessions revoked" } });
});

route.openapi(auditLogsDef, async (c) => {
  const guard = adminGuard(c);
  if (guard) return guard;
  const { userId, limit, offset } = c.req.valid("query");

  let sql = "SELECT id, user_id, action, details, ip, user_agent, created_at FROM audit_logs";
  const params: string[] = [];
  if (userId) {
    sql += " WHERE user_id = ?";
    params.push(userId);
  }
  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(String(limit), String(offset));

  const { results } = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ success: true, data: results });
});

export default route;
