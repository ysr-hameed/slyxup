import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema, verifyToken, verifyPassword, hashPassword, passwordSchema } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";
import { logAudit } from "../middleware/audit";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/change-password",
  summary: "Change password for authenticated user",
  tags: ["Auth"],
  security: [{ Bearer: [] }],
  request: {
    body: { content: { "application/json": { schema: z.object({
      currentPassword: z.string(),
      newPassword: passwordSchema,
    }) } } },
  },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ message: z.string() })) } }, description: "Password changed" },
    400: { description: "Invalid current password" },
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

  const { currentPassword, newPassword } = c.req.valid("json");
  const db = createDb(c.env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.sub)).get();
  if (!user) return c.json({ success: false, error: "User not found" }, 404);
  if (!user.passwordHash) return c.json({ success: false, error: "No password set. Use OAuth." }, 400);
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return c.json({ success: false, error: "Current password is incorrect" }, 400);
  }

  const newHash = await hashPassword(newPassword);
  await db.update(schema.users).set({ passwordHash: newHash, updatedAt: new Date().toISOString() }).where(eq(schema.users.id, user.id)).run();

  logAudit(c, "password_changed", user.id);
  logger.info("password_changed", { userId: user.id });

  return c.json({ success: true, data: { message: "Password changed successfully" } });
});

export default route;
