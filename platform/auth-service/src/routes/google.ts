import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema, generateToken, generateId, signToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq, and } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

route.get("/google", async (c) => {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", c.env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", c.env.GOOGLE_CALLBACK_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  return c.redirect(url.toString());
});

const callbackDef = createRoute({
  method: "get",
  path: "/google/callback",
  summary: "Google OAuth callback",
  tags: ["Auth"],
  request: { query: z.object({ code: z.string(), state: z.string().optional() }) },
  responses: {
    200: { content: { "application/json": { schema: apiResponseSchema(z.object({ token: z.string(), jwt: z.string(), user: z.any() })) } }, description: "OAuth success" },
    400: { description: "Invalid code" },
  },
});

route.openapi(callbackDef, async (c) => {
  const { code } = c.req.valid("query");

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: c.env.GOOGLE_CALLBACK_URL,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) return c.json({ success: false, error: "Failed to exchange code" }, 400);

  const tokens = await tokenResponse.json<{ access_token: string }>();
  const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userResponse.ok) return c.json({ success: false, error: "Failed to get user info" }, 400);

  const googleUser = await userResponse.json<{ id: string; email: string; name: string; picture: string }>();

  const db = createDb(c.env.DB);
  const existing = await db.select().from(schema.oauthAccounts).where(
    and(eq(schema.oauthAccounts.provider, "google"), eq(schema.oauthAccounts.providerUserId, googleUser.id)),
  ).get();

  let userId: string;
  if (existing) {
    userId = existing.userId;
  } else {
    userId = generateId();
    const now = new Date().toISOString();
    await db.insert(schema.users).values({
      id: userId, email: googleUser.email, name: googleUser.name,
      avatarUrl: googleUser.picture, createdAt: now, updatedAt: now,
    }).run();
    await db.insert(schema.oauthAccounts).values({
      id: generateId(), userId, provider: "google", providerUserId: googleUser.id, createdAt: now,
    }).run();
  }

  const sessionId = generateId();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  await db.insert(schema.sessions).values({ id: sessionId, userId, token, expiresAt, createdAt: new Date().toISOString() }).run();

  const jwt = await signToken({ sub: userId, email: googleUser.email, platform_id: "" }, c.env.JWT_SECRET, 86400);

  logger.info("google_login", { userId, email: googleUser.email });

  return c.json({
    success: true,
    data: { token, jwt, user: { id: userId, email: googleUser.email, name: googleUser.name, avatarUrl: googleUser.picture } },
  });
});

export default route;
