import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema, verifyToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";
import { logAudit } from "../middleware/audit";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/logout-all",
  summary: "Revoke all sessions for the authenticated user",
  tags: ["Auth"],
  security: [{ Bearer: [] }],
  request: {
    body: { content: { "application/json": { schema: z.object({}) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(z.object({ message: z.string() })) } },
      description: "All sessions revoked",
    },
    401: { description: "Unauthorized" },
  },
});

route.openapi(routeDef, async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Missing authorization header" }, 401);
  }

  const jwt = auth.slice(7);
  const payload = await verifyToken(jwt, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ success: false, error: "Invalid or expired token" }, 401);
  }

  const db = createDb(c.env.DB);
  const now = new Date().toISOString();

  await db.update(schema.sessions)
    .set({ revokedAt: now })
    .where(eq(schema.sessions.userId, payload.sub))
    .run();

  logAudit(c, "all_sessions_revoked", payload.sub);
  logger.info("all_sessions_revoked", { userId: payload.sub });

  return c.json({ success: true, data: { message: "All sessions revoked" } });
});

export default route;
