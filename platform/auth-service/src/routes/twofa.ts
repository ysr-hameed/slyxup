import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { verifyToken, apiResponseSchema } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq, and, gt } from "drizzle-orm";
import { hmacSign, derivePurposeKey } from "@slyxup/shared";
import {
  setup2FAAuthenticator, enable2FA, disable2FA, get2FASettings,
  setPreferred2FA, generateRecoveryCodes, initiateEmail2FA,
  initiate2FALogin, verify2FALogin,
} from "../services/twofa";
import { logSecurityEvent } from "../services/security-log";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

function getUserFromToken(c: any): { id: string; email: string } | null {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const payload: any = verifyToken(auth.slice(7), c.env.JWT_SECRET);
  return payload ? { id: payload.sub, email: payload.email } : null;
}

route.post("/login-2fa", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, method } = body;
    const ip = c.req.header("CF-Connecting-IP") || "";
    const result = await initiate2FALogin(c.env, email, password, undefined, method);
    logSecurityEvent(c.env, "2fa_login_initiated", result.userId, ip, { email });
    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 401);
  }
});

route.post("/verify-2fa", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, code, method, isBackupCode, challengeToken } = body;
    const result = await verify2FALogin(c.env, userId, code, method, isBackupCode, challengeToken);

    if (result.verified) {
      const db = createDb(c.env.DB);
      const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
      if (!user) return c.json({ success: false, error: "User not found" }, 401);
      if (user.blocked) return c.json({ success: false, error: "Account blocked" }, 403);

      const sessionId = crypto.randomUUID();
      const { generateToken, signToken } = await import("@slyxup/shared");
      const token = generateToken();
      const expiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
      const ip = c.req.header("CF-Connecting-IP") || "unknown";

      await db.insert(schema.sessions).values({
        id: sessionId, userId, token, ip,
        userAgent: c.req.header("User-Agent") || null,
        lastSeen: new Date().toISOString(),
        expiresAt, createdAt: new Date().toISOString(),
      }).run();

      const jwt = await signToken({ sub: user.id, email: user.email, platform_id: "" }, c.env.JWT_SECRET, 900);
      logSecurityEvent(c.env, "2fa_login_completed", userId, ip, { method: method || "authenticator" });

      return c.json({ success: true, data: { token, jwt, user: { id: user.id, email: user.email, name: user.name } } });
    }

    return c.json({ success: false, error: "Verification failed" }, 400);
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

route.get("/2fa/setup", async (c) => {
  const user = getUserFromToken(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
  try {
    const result = await setup2FAAuthenticator(c.env, user.id);
    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

route.post("/2fa/enable", async (c) => {
  const user = getUserFromToken(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
  try {
    const body = await c.req.json();
    const { method, code } = body;
    const result = await enable2FA(c.env, user.id, method, code);
    logSecurityEvent(c.env, "2fa_enabled", user.id, c.req.header("CF-Connecting-IP") || "", { method });
    return c.json({ success: true, data: result });
  } catch (e: any) {
    if (e.message === "EMAIL_CODE_REQUIRED") {
      const { code } = await initiateEmail2FA(c.env, user.id);
      return c.json({ success: true, data: { pendingVerification: true } });
    }
    return c.json({ success: false, error: e.message }, 400);
  }
});

route.post("/2fa/disable", async (c) => {
  const user = getUserFromToken(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
  try {
    const body = await c.req.json();
    const { method, code } = body;
    const result = await disable2FA(c.env, user.id, method, code);
    logSecurityEvent(c.env, "2fa_disabled", user.id, c.req.header("CF-Connecting-IP") || "", { method });
    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

route.get("/2fa/settings", async (c) => {
  const user = getUserFromToken(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
  try {
    const result = await get2FASettings(c.env, user.id);
    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

route.post("/2fa/preferred", async (c) => {
  const user = getUserFromToken(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
  try {
    const body = await c.req.json();
    const { method } = body;
    const result = await setPreferred2FA(c.env, user.id, method);
    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

route.post("/2fa/recovery-codes", async (c) => {
  const user = getUserFromToken(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
  try {
    const result = await generateRecoveryCodes(c.env, user.id);
    logSecurityEvent(c.env, "2fa_recovery_codes_generated", user.id, c.req.header("CF-Connecting-IP") || "", {});
    return c.json({ success: true, data: result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

route.post("/trust-device", async (c) => {
  const user = getUserFromToken(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
  try {
    const body = await c.req.json();
    const userAgent = c.req.header("User-Agent") || "unknown";
    const purposeKey = await derivePurposeKey(c.env.ENCRYPTION_KEY || c.env.JWT_SECRET, "device-fingerprint");
    const fingerprint = await hmacSign(userAgent, purposeKey);
    const expiresInDays = body.expiresInDays || 30;
    const db = createDb(c.env.DB);

    await db.delete(schema.trustedDevices).where(
      and(eq(schema.trustedDevices.userId, user.id), eq(schema.trustedDevices.fingerprint, fingerprint))
    ).run();

    await db.insert(schema.trustedDevices).values({
      id: crypto.randomUUID(), userId: user.id, fingerprint,
      trustedAt: new Date().toISOString(),
      expiresAt: Date.now() + expiresInDays * 86400000,
      deviceName: body.deviceName || null,
    }).run();

    return c.json({ success: true, data: { message: `Device trusted for ${expiresInDays} days` } });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

route.get("/trust-device", async (c) => {
  const user = getUserFromToken(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
  const db = createDb(c.env.DB);
  const devices = await db.select()
    .from(schema.trustedDevices)
    .where(and(eq(schema.trustedDevices.userId, user.id), gt(schema.trustedDevices.expiresAt, Date.now())))
    .all();
  return c.json({ success: true, data: { devices } });
});

route.delete("/trust-device", async (c) => {
  const user = getUserFromToken(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
  try {
    const body = await c.req.json();
    const db = createDb(c.env.DB);
    await db.delete(schema.trustedDevices)
      .where(and(eq(schema.trustedDevices.userId, user.id), eq(schema.trustedDevices.fingerprint, body.fingerprint)))
      .run();
    return c.json({ success: true, data: { message: "Device trust removed" } });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 400);
  }
});

export default route;
