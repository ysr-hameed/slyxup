import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema, generateId, signToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/refresh",
  summary: "Refresh JWT using session token",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: z.object({ token: z.string() }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(z.object({ jwt: z.string() })) } },
      description: "JWT refreshed",
    },
    401: { description: "Invalid or expired session" },
  },
});

route.openapi(routeDef, async (c) => {
  const { token } = c.req.valid("json");
  const db = createDb(c.env.DB);

  const session = await db.select().from(schema.sessions).where(eq(schema.sessions.token, token)).get();

  if (!session || session.revokedAt || new Date(session.expiresAt) < new Date()) {
    return c.json({ success: false, error: "Invalid or expired session" }, 401);
  }

  // Idle timeout: auto-revoke if inactive for 7 days
  if (session.lastSeen && (Date.now() - new Date(session.lastSeen).getTime()) > 7 * 86400000) {
    await db.update(schema.sessions).set({ revokedAt: new Date().toISOString() })
      .where(eq(schema.sessions.id, session.id)).run();
    return c.json({ success: false, error: "Session expired due to inactivity" }, 401);
  }

  const user = await db.select().from(schema.users).where(eq(schema.users.id, session.userId)).get();
  if (!user || user.blocked || user.deletedAt) {
    return c.json({ success: false, error: "User account unavailable" }, 401);
  }

  await db.update(schema.sessions).set({
    lastSeen: new Date().toISOString(),
  }).where(eq(schema.sessions.id, session.id)).run();

  const jwt = await signToken({ sub: user.id, email: user.email, platform_id: "" }, c.env.JWT_SECRET, 900);

  return c.json({ success: true, data: { jwt } });
});

export default route;
