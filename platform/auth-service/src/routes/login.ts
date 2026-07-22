import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { loginSchema, apiResponseSchema, verifyPassword, generateToken, generateId, signToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

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
            token: z.string(), jwt: z.string(),
            user: z.object({ id: z.string(), email: z.string(), name: z.string().nullable() }),
          })),
        },
      },
      description: "Login successful",
    },
    400: { description: "Validation error" },
    401: { description: "Invalid email or password" },
    403: { description: "Account blocked or deleted" },
  },
});

route.openapi(routeDef, async (c) => {
  const { email, password } = c.req.valid("json");

  const db = createDb(c.env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();

  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ success: false, error: "Invalid email or password" }, 401);
  }

  if (user.blocked) return c.json({ success: false, error: "Account is blocked" }, 403);
  if (user.deletedAt) return c.json({ success: false, error: "Account has been deleted" }, 403);

  const sessionId = generateId();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

  await db.insert(schema.sessions).values({
    id: sessionId, userId: user.id, token, expiresAt, createdAt: new Date().toISOString(),
  }).run();

  const jwt = await signToken({ sub: user.id, email: user.email, platform_id: "" }, c.env.JWT_SECRET, 86400);

  logger.info("user_login", { userId: user.id, email: user.email });

  return c.json({ success: true, data: { token, jwt, user: { id: user.id, email: user.email, name: user.name } } });
});

export default route;
