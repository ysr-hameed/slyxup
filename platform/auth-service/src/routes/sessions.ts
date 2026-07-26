import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema, verifyToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq, and, isNull } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const listDef = createRoute({
  method: "get",
  path: "/sessions",
  summary: "List active sessions for the authenticated user",
  tags: ["Auth"],
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(z.array(z.object({
        id: z.string(), ip: z.string().nullable(),
        userAgent: z.string().nullable(), lastSeen: z.string().nullable(),
        createdAt: z.string(), expiresAt: z.string(),
      }))) } },
      description: "List of active sessions",
    },
    401: { description: "Unauthorized" },
  },
});

const revokeDef = createRoute({
  method: "delete",
  path: "/sessions/{id}",
  summary: "Revoke a specific session",
  tags: ["Auth"],
  security: [{ Bearer: [] }],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ message: z.string() })) } }, description: "Session revoked" },
    401: { description: "Unauthorized" },
    404: { description: "Session not found" },
  },
});

route.openapi(listDef, async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Missing authorization header" }, 401);
  }

  const payload = await verifyToken(auth.slice(7), c.env.JWT_SECRET);
  if (!payload) return c.json({ success: false, error: "Invalid or expired token" }, 401);

  const db = createDb(c.env.DB);
  const sessions = await db.select({
    id: schema.sessions.id,
    ip: schema.sessions.ip,
    userAgent: schema.sessions.userAgent,
    lastSeen: schema.sessions.lastSeen,
    createdAt: schema.sessions.createdAt,
    expiresAt: schema.sessions.expiresAt,
  }).from(schema.sessions)
    .where(and(
      eq(schema.sessions.userId, payload.sub),
      isNull(schema.sessions.revokedAt),
    ))
    .orderBy(schema.sessions.createdAt)
    .all();

  return c.json({ success: true, data: sessions });
});

route.openapi(revokeDef, async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Missing authorization header" }, 401);
  }

  const payload = await verifyToken(auth.slice(7), c.env.JWT_SECRET);
  if (!payload) return c.json({ success: false, error: "Invalid or expired token" }, 401);

  const { id } = c.req.valid("param");
  const db = createDb(c.env.DB);

  const session = await db.select().from(schema.sessions)
    .where(and(eq(schema.sessions.id, id), eq(schema.sessions.userId, payload.sub)))
    .get();

  if (!session) return c.json({ success: false, error: "Session not found" }, 404);

  await db.update(schema.sessions)
    .set({ revokedAt: new Date().toISOString() })
    .where(eq(schema.sessions.id, id))
    .run();

  logger.info("session_revoked", { userId: payload.sub, sessionId: id });

  return c.json({ success: true, data: { message: "Session revoked" } });
});

export default route;
