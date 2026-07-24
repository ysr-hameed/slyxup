import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "get",
  path: "/verify",
  summary: "Verify email with token",
  tags: ["Auth"],
  request: { query: z.object({ token: z.string() }) },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ message: z.string() })) } }, description: "Email verified" },
    400: { description: "Invalid token" },
  },
});

route.openapi(routeDef, async (c) => {
  const { token } = c.req.valid("query");

  const db = createDb(c.env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.emailVerificationToken, token)).get();

  if (!user) {
    return c.json({ success: false, error: "Invalid or expired verification token" }, 400);
  }

  if (user.emailVerified) {
    return c.json({ success: true, data: { message: "Email already verified" } });
  }

  await db.update(schema.users).set({
    emailVerified: 1,
    emailVerificationToken: null,
  }).where(eq(schema.users.id, user.id)).run();

  logger.info("email_verified", { userId: user.id, email: user.email });

  return c.json({ success: true, data: { message: "Email verified successfully" } });
});

export default route;
