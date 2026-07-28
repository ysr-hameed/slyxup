import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { loginSchema, apiResponseSchema, verifyPassword, generateToken, generateId, signToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq, and } from "drizzle-orm";
import { logger } from "@slyxup/logger";
import { logAudit } from "../middleware/audit";

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
  const { email, password, platform } = c.req.valid("json");

  const db = createDb(c.env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();

  if (!user || !user.passwordHash) {
    return c.json({ success: false, error: "Invalid email or password" }, 401);
  }

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    return c.json({ success: false, error: "Account temporarily locked. Try again later." }, 423);
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    const newAttempts = (user.failedAttempts ?? 0) + 1;
    if (newAttempts >= 5) {
      const lockedUntil = new Date(Date.now() + 15 * 60000).toISOString();
      await db.update(schema.users).set({ failedAttempts: newAttempts, lockedUntil }).where(eq(schema.users.id, user.id)).run();
    } else {
      await db.update(schema.users).set({ failedAttempts: newAttempts }).where(eq(schema.users.id, user.id)).run();
    }
    logAudit(c, "login_failed", user.id, `failed_attempts=${newAttempts}`);
    return c.json({ success: false, error: "Invalid email or password" }, 401);
  }

  if (user.failedAttempts && user.failedAttempts > 0) {
    await db.update(schema.users).set({ failedAttempts: 0, lockedUntil: null }).where(eq(schema.users.id, user.id)).run();
  }

  if (user.blocked) return c.json({ success: false, error: "Account is blocked" }, 403);
  if (user.deletedAt) return c.json({ success: false, error: "Account has been deleted" }, 403);
  if (!user.emailVerified) return c.json({ success: false, error: "Email not verified. Please check your inbox." }, 403);

  const sessionId = generateId();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "unknown";
  const userAgent = c.req.header("User-Agent") ?? null;

  await db.insert(schema.sessions).values({
    id: sessionId, userId: user.id, token, ip, userAgent,
    lastSeen: new Date().toISOString(),
    expiresAt, createdAt: new Date().toISOString(),
  }).run();

  let platformId = "";
  if (platform) {
    const membership = await db.select().from(schema.platformMemberships)
      .innerJoin(schema.platforms, eq(schema.platformMemberships.platformId, schema.platforms.id))
      .where(and(
        eq(schema.platforms.slug, platform),
        eq(schema.platformMemberships.userId, user.id),
      ))
      .get();
    if (membership) platformId = membership.platform_memberships.platformId;
  }

  const jwt = await signToken({ sub: user.id, email: user.email, platform_id: platformId }, c.env.JWT_SECRET, 900);

  logAudit(c, "user_login", user.id, `platform=${platform || "none"}`);
  logger.info("user_login", { userId: user.id, email: user.email });

  return c.json({ success: true, data: { token, jwt, user: { id: user.id, email: user.email, name: user.name } } });
});

export default route;
