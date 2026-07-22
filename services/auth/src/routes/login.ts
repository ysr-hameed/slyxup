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
  summary: "Login with email and password (SSO)",
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
            }),
            platforms: z.array(z.object({
              id: z.string(),
              slug: z.string(),
              name: z.string().nullable(),
              role: z.string(),
            })),
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
  const { email, password } = c.req.valid("json");

  const db = createAuthDb(c.env.DB);
  const user = await db
    .select()
    .from(authSchema.users)
    .where(eq(authSchema.users.email, email))
    .get();

  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash)))
    return c.json({ success: false, error: "Invalid email or password" }, 401);

  if (user.blocked)
    return c.json({ success: false, error: "Account is blocked" }, 403);
  if (user.deletedAt)
    return c.json({ success: false, error: "Account has been deleted" }, 403);

  const memberships = await db
    .select({
      id: authSchema.platforms.id,
      slug: authSchema.platforms.slug,
      name: authSchema.platforms.name,
      role: authSchema.platformMemberships.role,
    })
    .from(authSchema.platformMemberships)
    .innerJoin(authSchema.platforms, eq(authSchema.platformMemberships.platformId, authSchema.platforms.id))
    .where(eq(authSchema.platformMemberships.userId, user.id))
    .all();

  const platformId = memberships.length > 0 ? memberships[0]!.id : "default";

  const sessionId = generateId();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

  await db.insert(authSchema.sessions).values({
    id: sessionId, userId: user.id, token, expiresAt,
  }).run();

  const jwt = await signToken(
    { sub: user.id, email: user.email, platform_id: platformId },
    c.env.JWT_SECRET, 86400,
  );

  logger.info("user_login", { userId: user.id, email: user.email, platformId });

  return c.json({
    success: true,
    data: {
      token, jwt,
      user: { id: user.id, email: user.email, name: user.name },
      platforms: memberships.map(m => ({ id: m.id, slug: m.slug, name: m.name, role: m.role })),
    },
  });
});

export default route;
