import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema, generateToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/forgot-password",
  summary: "Send password reset email",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: z.object({ email: z.string().email() }) } } },
  },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ message: z.string() })) } }, description: "Reset email sent" },
  },
});

route.openapi(routeDef, async (c) => {
  const { email } = c.req.valid("json");
  const db = createDb(c.env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();

  if (!user) {
    return c.json({ success: true, data: { message: "If an account with that email exists, a reset link has been sent." } });
  }

  const resetToken = generateToken();
  const expires = new Date(Date.now() + 3600000).toISOString();

  await db.update(schema.users).set({
    passwordResetToken: resetToken,
    passwordResetExpires: expires,
  }).where(eq(schema.users.id, user.id)).run();

  const resetLink = `${c.env.APP_DOMAIN}/reset-password?token=${resetToken}`;

  fetch(`${c.env.EMAIL_SERVICE_URL}/api/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": c.env.API_KEY },
    body: JSON.stringify({
      to: [user.email],
      subject: "Password Reset - SlyxUp",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    }),
  }).catch(() => {});

  if (c.env.ENVIRONMENT === "development") {
    logger.info("dev_reset_link", { resetLink });
  }

  logger.info("password_reset_requested", { userId: user.id, email: user.email });

  return c.json({ success: true, data: { message: "If an account with that email exists, a reset link has been sent." } });
});

export default route;
