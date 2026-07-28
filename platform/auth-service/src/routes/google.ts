import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema, generateToken, generateId, signToken } from "@slyxup/shared";
import { logger } from "@slyxup/logger";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq, and } from "drizzle-orm";
import { logAudit } from "../middleware/audit";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

route.get("/google", async (c) => {
  const state = generateToken();
  const redirectUrl = c.req.query("redirect_url") || c.env.APP_DOMAIN || "";
  const db = createDb(c.env.DB);
  const expiresAt = new Date(Date.now() + 300000).toISOString();
  await db.insert(schema.oauthStates).values({
    id: generateId(), state, provider: "google",
    redirectTo: redirectUrl,
    expiresAt, createdAt: new Date().toISOString(),
  }).run();

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", c.env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", c.env.GOOGLE_CALLBACK_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("state", state);
  c.header("Set-Cookie", `oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=300`);
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
  const { code, state } = c.req.valid("query");

  const db = createDb(c.env.DB);
  let oauthRedirectUrl = c.env.APP_DOMAIN || "";
  if (state) {
    const stored = await db.select().from(schema.oauthStates).where(eq(schema.oauthStates.state, state)).get();
    if (!stored || new Date(stored.expiresAt) < new Date()) {
      return c.json({ success: false, error: "Invalid or expired state parameter" }, 400);
    }
    oauthRedirectUrl = stored.redirectTo || oauthRedirectUrl;
    await db.delete(schema.oauthStates).where(eq(schema.oauthStates.id, stored.id)).run();
  }

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

  const googleUser = await userResponse.json<{ id: string; email: string; name: string; picture: string; verified_email?: boolean }>();
  if (googleUser.verified_email === false) {
    return c.json({ success: false, error: "Google email not verified" }, 400);
  }

  const existing = await db.select().from(schema.oauthAccounts).where(
    and(eq(schema.oauthAccounts.provider, "google"), eq(schema.oauthAccounts.providerUserId, googleUser.id)),
  ).get();

  let userId: string;
  if (existing) {
    userId = existing.userId;
  } else {
    const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, googleUser.email)).get();
    if (existingUser?.passwordHash) {
      return c.json({ success: false, error: "An account with this email already uses email/password login. Sign in with your email and password instead." }, 409);
    }
    userId = generateId();
    const now = new Date().toISOString();
    await db.insert(schema.users).values({
      id: userId, email: googleUser.email, name: googleUser.name,
      avatarUrl: googleUser.picture, emailVerified: 1, createdAt: now, updatedAt: now,
    }).run();
    await db.insert(schema.oauthAccounts).values({
      id: generateId(), userId, provider: "google", providerUserId: googleUser.id, createdAt: now,
    }).run();
  }

  const sessionId = generateId();
  const token = generateToken();
  const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "unknown";
  const userAgent = c.req.header("User-Agent") ?? null;
  const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
  await db.insert(schema.sessions).values({
    id: sessionId, userId, token, ip, userAgent,
    lastSeen: new Date().toISOString(),
    expiresAt, createdAt: new Date().toISOString(),
  }).run();

  const jwt = await signToken({ sub: userId, email: googleUser.email, platform_id: "" }, c.env.JWT_SECRET, 900);

  logAudit(c, "google_login", userId);
  logger.info("google_login", { userId, email: googleUser.email });

  return c.redirect(
    `${oauthRedirectUrl}/oauth/callback?jwt=${encodeURIComponent(jwt)}&token=${encodeURIComponent(token)}`
  );
});

export default route;
