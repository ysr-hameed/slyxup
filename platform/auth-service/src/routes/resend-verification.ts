import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema, generateToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { verificationEmailHtml } from "../email";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/resend-verification",
  summary: "Resend email verification link",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: z.object({ email: z.string().email() }) } } },
  },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ message: z.string() })) } }, description: "Verification email sent" },
  },
});

route.openapi(routeDef, async (c) => {
  const { email } = c.req.valid("json");
  const db = createDb(c.env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();

  if (!user || user.emailVerified) {
    return c.json({ success: true, data: { message: "If an unverified account exists, a verification email has been sent." } });
  }

  const verificationToken = generateToken();
  await db.update(schema.users).set({
    emailVerificationToken: verificationToken,
    updatedAt: new Date().toISOString(),
  }).where(eq(schema.users.id, user.id)).run();

  const verifyLink = `${c.env.APP_DOMAIN}/verify-email?token=${verificationToken}`;
  fetch(`${c.env.EMAIL_SERVICE_URL}/api/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": c.env.API_KEY },
    body: JSON.stringify({
      to: [user.email],
      subject: "Verify your email - SlyxUp",
      html: verificationEmailHtml(verifyLink),
    }),
  }).catch(() => {});

  if (c.env.ENVIRONMENT === "development") {
    logger.info("dev_verification_link", { verifyLink });
  }

  logger.info("verification_resent", { userId: user.id, email: user.email });

  return c.json({ success: true, data: { message: "If an unverified account exists, a verification email has been sent." } });
});

export default route;
