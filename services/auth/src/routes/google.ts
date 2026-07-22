import { Hono } from "hono";
import type { AuthEnv, ApiResponse } from "@slyxup/shared-types";
import { createAuthDb, authSchema } from "@slyxup/shared-db";
import { signToken, generateToken, generateId } from "@slyxup/shared-utils";
import { logger } from "@slyxup/shared-logger";
import { eq } from "drizzle-orm";

const route = new Hono<{ Bindings: AuthEnv }>();

route.get("/google/login", (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return c.json<ApiResponse>({ success: false, error: "Google login not configured" }, 500);
  }

  const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`;
  const url =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
    });

  return c.json<ApiResponse<{ url: string }>>({ success: true, data: { url } });
});

route.get("/google/callback", async (c) => {
  const code = c.req.query("code");
  if (!code) {
    return c.json<ApiResponse>({ success: false, error: "Authorization code missing" }, 400);
  }

  const clientId = c.env.GOOGLE_CLIENT_ID;
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${new URL(c.req.url).origin}/api/auth/google/callback`;

  try {
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResp.ok) {
      const errText = await tokenResp.text();
      logger.error("Google token exchange failed", { status: tokenResp.status, body: errText });
      return c.json<ApiResponse>({ success: false, error: "Failed to authenticate with Google" }, 401);
    }

    const tokens = await tokenResp.json() as { access_token: string; id_token?: string };

    const userResp = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo?" + new URLSearchParams({ access_token: tokens.access_token }),
    );

    if (!userResp.ok) {
      return c.json<ApiResponse>({ success: false, error: "Failed to get user info" }, 401);
    }

    const googleUser = await userResp.json() as {
      id: string;
      email: string;
      name: string;
      picture: string;
    };

    const db = createAuthDb(c.env.DB);

    let user = await db
      .select()
      .from(authSchema.users)
      .where(eq(authSchema.users.googleId, googleUser.id))
      .get();

    if (!user) {
      user = await db
        .select()
        .from(authSchema.users)
        .where(eq(authSchema.users.email, googleUser.email))
        .get();
    }

    if (user) {
      await db
        .update(authSchema.users)
        .set({
          googleId: googleUser.id,
          avatarUrl: googleUser.picture,
          name: user.name ?? googleUser.name,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(authSchema.users.id, user.id))
        .run();
    } else {
      const newId = generateId();
      await db
        .insert(authSchema.users)
        .values({
          id: newId,
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.id,
          avatarUrl: googleUser.picture,
        })
        .run();

      user = await db
        .select()
        .from(authSchema.users)
        .where(eq(authSchema.users.id, newId))
        .get()!;
    }

    if (!user) {
      return c.json<ApiResponse>({ success: false, error: "Failed to create user" }, 500);
    }

    const sessionId = generateId();
    const sessionToken = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

    await db
      .insert(authSchema.sessions)
      .values({ id: sessionId, userId: user.id, token: sessionToken, expiresAt })
      .run();

    const jwt = await signToken(
      { sub: user.id, email: user.email },
      c.env.JWT_SECRET,
      86400,
    );

    return c.redirect(`/auth/callback?jwt=${jwt}&token=${sessionToken}`);
  } catch (err) {
    logger.error("Google OAuth error", { error: err instanceof Error ? err.message : String(err) });
    return c.json<ApiResponse>({ success: false, error: "Authentication failed" }, 500);
  }
});

export default route;
