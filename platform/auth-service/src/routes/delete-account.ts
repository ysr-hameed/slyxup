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
  method: "delete",
  path: "/me",
  summary: "Delete (soft-delete) own account",
  tags: ["Auth"],
  security: [{ Bearer: [] }],
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ message: z.string() })) } }, description: "Account deleted" },
    401: { description: "Unauthorized" },
  },
});

route.openapi(routeDef, async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Missing authorization header" }, 401);
  }

  const payload = await verifyToken(auth.slice(7), c.env.JWT_SECRET);
  if (!payload) return c.json({ success: false, error: "Invalid or expired token" }, 401);

  const db = createDb(c.env.DB);
  const now = new Date().toISOString();

  await db.update(schema.users).set({ deletedAt: now, updatedAt: now }).where(eq(schema.users.id, payload.sub)).run();
  await db.update(schema.sessions).set({ revokedAt: now }).where(eq(schema.sessions.userId, payload.sub)).run();

  logAudit(c, "account_deleted", payload.sub);
  logger.info("account_deleted", { userId: payload.sub });

  return c.json({ success: true, data: { message: "Account deleted successfully" } });
});

export default route;
