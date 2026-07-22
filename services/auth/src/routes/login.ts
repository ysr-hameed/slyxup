import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared-types";
import { verifyPassword, generateToken, generateId, signToken, loginSchema, apiResponseSchema } from "@slyxup/shared-utils";
import { createAuthDb, authSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/shared-logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/login",
  summary: "Login with email and password",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: loginSchema } } },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({
            token: z.string(),
            jwt: z.string(),
            user: z.object({
              id: z.string(),
              email: z.string(),
              name: z.string().nullable(),
              platform: z.string(),
            }),
          })),
        },
      },
      description: "Login successful",
    },
    400: { description: "Validation error" },
    401: { description: "Invalid email or password" },
  },
});

route.openapi(routeDef, async (c) => {
  const { email, password, platform } = c.req.valid("json");

  const db = createAuthDb(c.env.DB);
  const user = await db
    .select()
    .from(authSchema.users)
    .where(eq(authSchema.users.email, email))
    .get();

  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash)))
    return c.json({ success: false, error: "Invalid email or password" }, 401);

  if (platform && user.platform !== platform)
    return c.json({ success: false, error: "Invalid email or password" }, 401);

  const sessionId = generateId();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

  await db.insert(authSchema.sessions).values({
    id: sessionId, userId: user.id, token, expiresAt,
  }).run();

  const jwt = await signToken(
    { sub: user.id, email: user.email, platform: user.platform },
    c.env.JWT_SECRET, 86400,
  );

  logger.info("user_login", { userId: user.id, email: user.email, platform: user.platform });

  return c.json({
    success: true,
    data: {
      token, jwt,
      user: { id: user.id, email: user.email, name: user.name, platform: user.platform },
    },
  });
});

export default route;
