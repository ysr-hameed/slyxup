import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema, hashPassword } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/reset-password",
  summary: "Reset password with token",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: z.object({
      token: z.string(),
      password: z.string().min(6),
    }) } } },
  },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ message: z.string() })) } }, description: "Password reset" },
    400: { description: "Invalid or expired token" },
  },
});

route.openapi(routeDef, async (c) => {
  const { token, password } = c.req.valid("json");
  const db = createDb(c.env.DB);

  const user = await db.select().from(schema.users).where(eq(schema.users.passwordResetToken, token)).get();

  if (!user || !user.passwordResetExpires || new Date(user.passwordResetExpires) < new Date()) {
    return c.json({ success: false, error: "Invalid or expired reset token" }, 400);
  }

  const passwordHash = await hashPassword(password);

  await db.update(schema.users).set({
    passwordHash,
    passwordResetToken: null,
    passwordResetExpires: null,
  }).where(eq(schema.users.id, user.id)).run();

  logger.info("password_reset_completed", { userId: user.id });

  return c.json({ success: true, data: { message: "Password reset successfully" } });
});

export default route;
