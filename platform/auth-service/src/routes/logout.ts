import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/logout",
  summary: "Logout and revoke session",
  tags: ["Auth"],
  responses: {
    200: { description: "Logged out successfully" },
    401: { description: "Invalid or missing token" },
  },
});

route.openapi(routeDef, async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Missing authorization header" }, 401);
  }

  const token = authHeader.slice(7);
  const db = createDb(c.env.DB);
  const session = await db.select().from(schema.sessions).where(eq(schema.sessions.token, token)).get();

  if (!session) return c.json({ success: false, error: "Invalid session" }, 401);

  await db.update(schema.sessions).set({ revokedAt: new Date().toISOString() })
    .where(eq(schema.sessions.id, session.id)).run();

  logger.info("user_logout", { userId: session.userId });
  return c.json({ success: true, data: { message: "Logged out successfully" } });
});

export default route;
