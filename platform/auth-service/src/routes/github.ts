import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema, generateToken, generateId, signToken } from "@slyxup/shared";
import { logger } from "@slyxup/logger";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq, and } from "drizzle-orm";
import { logAudit } from "../middleware/audit";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

route.get("/github", async (c) => {
  const state = generateToken();
  const db = createDb(c.env.DB);
  const expiresAt = new Date(Date.now() + 300000).toISOString();
  await db.insert(schema.oauthStates).values({
    id: generateId(), state, provider: "github",
    expiresAt, createdAt: new Date().toISOString(),
  }).run();

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", c.env.GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", c.env.GITHUB_CALLBACK_URL);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);
  c.header("Set-Cookie", `github_oauth_state=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=300`);
  return c.redirect(url.toString());
});

const callbackDef = createRoute({
  method: "get",
  path: "/github/callback",
  summary: "GitHub OAuth callback",
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
  if (state) {
    const stored = await db.select().from(schema.oauthStates).where(eq(schema.oauthStates.state, state)).get();
    if (!stored || new Date(stored.expiresAt) < new Date()) {
      return c.json({ success: false, error: "Invalid or expired state parameter" }, 400);
    }
    await db.delete(schema.oauthStates).where(eq(schema.oauthStates.id, stored.id)).run();
  }

  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: c.env.GITHUB_CLIENT_ID,
      client_secret: c.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: c.env.GITHUB_CALLBACK_URL,
    }),
  });

  if (!tokenResponse.ok) return c.json({ success: false, error: "Failed to exchange code" }, 400);

  const tokens = await tokenResponse.json<{ access_token: string; error?: string }>();
  if (tokens.error) return c.json({ success: false, error: tokens.error }, 400);

  const userResponse = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" },
  });

  if (!userResponse.ok) return c.json({ success: false, error: "Failed to get user info" }, 400);

  const githubUser = await userResponse.json<{ id: number; login: string; name: string | null; avatar_url: string; email: string | null }>();

  let email = githubUser.email;
  if (!email) {
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" },
    });
    if (emailsResponse.ok) {
      const emails = await emailsResponse.json<{ email: string; primary: boolean; verified: boolean }[]>();
      const primary = emails.find(e => e.primary && e.verified);
      if (primary) email = primary.email;
    }
  }

  if (!email) return c.json({ success: false, error: "No verified email found on GitHub account" }, 400);

  const existing = await db.select().from(schema.oauthAccounts).where(
    and(eq(schema.oauthAccounts.provider, "github"), eq(schema.oauthAccounts.providerUserId, String(githubUser.id))),
  ).get();

  let userId: string;
  if (existing) {
    userId = existing.userId;
  } else {
    const emailExisting = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();
    if (emailExisting) {
      await db.insert(schema.oauthAccounts).values({
        id: generateId(), userId: emailExisting.id, provider: "github", providerUserId: String(githubUser.id), createdAt: new Date().toISOString(),
      }).run();
      await db.update(schema.users).set({ emailVerified: 1, updatedAt: new Date().toISOString() }).where(eq(schema.users.id, emailExisting.id)).run();
      userId = emailExisting.id;
    } else {
      userId = generateId();
      const now = new Date().toISOString();
      await db.insert(schema.users).values({
        id: userId, email, name: githubUser.name ?? githubUser.login,
        avatarUrl: githubUser.avatar_url, emailVerified: 1, createdAt: now, updatedAt: now,
      }).run();
      await db.insert(schema.oauthAccounts).values({
        id: generateId(), userId, provider: "github", providerUserId: String(githubUser.id), createdAt: now,
      }).run();
    }
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

  const jwt = await signToken({ sub: userId, email, platform_id: "" }, c.env.JWT_SECRET, 900);

  logAudit(c, "github_login", userId);
  logger.info("github_login", { userId, email });

  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();

  return c.json({
    success: true,
    data: { token, jwt, user: { id: userId, email, name: user?.name ?? null, avatarUrl: user?.avatarUrl ?? null } },
  });
});

export default route;
