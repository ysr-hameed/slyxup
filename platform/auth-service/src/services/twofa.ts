import type { AuthEnv } from "@slyxup/shared";
import {
  generateTOTPSecret, verifyTOTP, generateQRCodeURL,
  generateBackupCodes, generateHashedBackupCodes, verifyBackupCode, generateOTP,
  encrypt, decrypt, hashWithSalt, verifyHash, hashToken,
  signToken, verifyToken,
} from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logSecurityEvent } from "./security-log";

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const CHALLENGE_EXPIRY_S = 300;

type JwtPayload = { sub: string; purpose?: string; exp: number; iat: number };

function generateChallengeToken(userId: string, secret: string): Promise<string> {
  return signToken({ sub: userId, purpose: "2fa-challenge" } as any, secret, CHALLENGE_EXPIRY_S);
}

async function verifyChallengeToken(token: string, secret: string): Promise<{ userId: string } | null> {
  const decoded = await verifyToken(token, secret) as JwtPayload | null;
  if (!decoded || decoded.purpose !== "2fa-challenge") return null;
  return { userId: decoded.sub };
}

export async function setup2FAAuthenticator(env: AuthEnv, userId: string) {
  const db = createDb(env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) throw new Error("User not found");
  if (user.twoFactorEnabled && user.twoFactorSecret) throw new Error("2FA is already enabled");

  const secret = generateTOTPSecret();
  const qrCodeURL = generateQRCodeURL(user.email || userId, secret);
  const encryptedSecret = await encrypt(secret, env.ENCRYPTION_KEY);

  await db.update(schema.users).set({
    twoFactorSecret: encryptedSecret,
    updatedAt: new Date().toISOString(),
  }).where(eq(schema.users.id, userId)).run();

  return { secret, qrCodeURL };
}

export async function enable2FA(env: AuthEnv, userId: string, method: "authenticator" | "email", code?: string) {
  const db = createDb(env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) throw new Error("User not found");

  if (method === "authenticator") {
    if (!code || !user.twoFactorSecret) throw new Error("Verification code required");
    const decryptedSecret = await decrypt(user.twoFactorSecret, env.ENCRYPTION_KEY);
    const valid = await verifyTOTP(decryptedSecret, code);
    if (!valid) throw new Error("Invalid verification code");

    const backupCodes = generateBackupCodes(10);
    const hashedBackupCodes = await generateHashedBackupCodes(backupCodes);

    await db.update(schema.users).set({
      twoFactorEnabled: true,
      preferred2FA: "authenticator",
      twoFactorSecret: await encrypt(decryptedSecret, env.ENCRYPTION_KEY),
      backupCodes: JSON.stringify(hashedBackupCodes),
      updatedAt: new Date().toISOString(),
    }).where(eq(schema.users.id, userId)).run();

    return { twoFactorEnabled: true, email2FAEnabled: !!user.email2FAEnabled, method: "authenticator", backupCodes };
  }

  if (method === "email") {
    if (!code) {
      const loginCode = generateOTP();
      const loginCodeHash = await hashWithSalt(loginCode);
      await db.update(schema.users).set({
        loginOTP: loginCodeHash,
        loginOTPExpiry: new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
        updatedAt: new Date().toISOString(),
      }).where(eq(schema.users.id, userId)).run();
      throw new Error("EMAIL_CODE_REQUIRED");
    }

    const storedHash = user.loginOTP;
    if (!storedHash || !(await verifyHash(code, storedHash))) throw new Error("Invalid verification code");
    if (user.loginOTPExpiry && new Date(user.loginOTPExpiry) < new Date()) throw new Error("Verification code has expired");

    await db.update(schema.users).set({
      email2FAEnabled: true,
      preferred2FA: "email",
      loginOTP: null,
      loginOTPExpiry: null,
      updatedAt: new Date().toISOString(),
    }).where(eq(schema.users.id, userId)).run();

    return { twoFactorEnabled: !!user.twoFactorEnabled, email2FAEnabled: true, method: "email" };
  }

  throw new Error("Invalid method");
}

export async function disable2FA(env: AuthEnv, userId: string, method: "authenticator" | "email", code?: string) {
  const db = createDb(env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) throw new Error("User not found");

  if (method === "authenticator") {
    if (!user.twoFactorEnabled) return { twoFactorEnabled: false, email2FAEnabled: !!user.email2FAEnabled };
    if (user.twoFactorSecret) {
      if (!code) throw new Error("Verification code required");
      const decryptedSecret = await decrypt(user.twoFactorSecret, env.ENCRYPTION_KEY);
      if (!(await verifyTOTP(decryptedSecret, code))) throw new Error("Invalid verification code");
    }
    await db.update(schema.users).set({
      twoFactorEnabled: false, twoFactorSecret: null, backupCodes: null,
      updatedAt: new Date().toISOString(),
    }).where(eq(schema.users.id, userId)).run();
    return { twoFactorEnabled: false, email2FAEnabled: !!user.email2FAEnabled };
  }

  if (method === "email") {
    if (!user.email2FAEnabled) return { email2FAEnabled: false, twoFactorEnabled: !!user.twoFactorEnabled };
    if (!code) throw new Error("Code required");
    if (!user.loginOTP || !(await verifyHash(code, user.loginOTP))) throw new Error("Invalid verification code");
    await db.update(schema.users).set({
      email2FAEnabled: false, loginOTP: null, loginOTPExpiry: null,
      updatedAt: new Date().toISOString(),
    }).where(eq(schema.users.id, userId)).run();
    return { email2FAEnabled: false, twoFactorEnabled: !!user.twoFactorEnabled };
  }

  throw new Error("Invalid method");
}

export async function get2FASettings(env: AuthEnv, userId: string) {
  const db = createDb(env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) throw new Error("User not found");
  return {
    authenticatorEnabled: !!user.twoFactorEnabled,
    email2FAEnabled: !!user.email2FAEnabled,
    preferred2FA: user.preferred2FA,
  };
}

export async function setPreferred2FA(env: AuthEnv, userId: string, method: "authenticator" | "email") {
  const db = createDb(env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) throw new Error("User not found");
  if (!user.twoFactorEnabled && !user.email2FAEnabled) throw new Error("2FA is not enabled");
  await db.update(schema.users).set({ preferred2FA: method, updatedAt: new Date().toISOString() }).where(eq(schema.users.id, userId)).run();
  return { preferred2FA: method };
}

export async function generateRecoveryCodes(env: AuthEnv, userId: string) {
  const db = createDb(env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) throw new Error("User not found");
  if (!user.twoFactorEnabled && !user.email2FAEnabled) throw new Error("2FA is not enabled");

  const newCodes = generateBackupCodes(10);
  const hashedCodes = await generateHashedBackupCodes(newCodes);
  await db.update(schema.users).set({ backupCodes: JSON.stringify(hashedCodes), updatedAt: new Date().toISOString() }).where(eq(schema.users.id, userId)).run();
  return { backupCodes: newCodes };
}

export async function initiate2FALogin(env: AuthEnv, email: string, password: string, _fingerprint?: string, _method?: "authenticator" | "email") {
  const db = createDb(env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();
  if (!user || !user.passwordHash) throw new Error("Invalid email or password");
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) throw new Error("Account temporarily locked");
  if (user.blocked) throw new Error("Account blocked");
  if (!user.emailVerified) throw new Error("Please verify your email first");

  const { verifyPassword } = await import("@slyxup/shared");
  if (!(await verifyPassword(password, user.passwordHash))) {
    const attempts = (user.failedAttempts || 0) + 1;
    if (attempts >= 5) {
      await db.update(schema.users).set({ failedAttempts: attempts, lockedUntil: new Date(Date.now() + 15 * 60000).toISOString() }).where(eq(schema.users.id, user.id)).run();
      throw new Error("Too many failed attempts. Account locked for 15 minutes.");
    }
    await db.update(schema.users).set({ failedAttempts: attempts }).where(eq(schema.users.id, user.id)).run();
    throw new Error("Invalid email or password");
  }

  await db.update(schema.users).set({ failedAttempts: 0, lockedUntil: null }).where(eq(schema.users.id, user.id)).run();

  const hasAuthenticator = !!user.twoFactorEnabled && !!user.twoFactorSecret;
  const hasEmail2FA = !!user.email2FAEnabled;

  if (!hasAuthenticator && !hasEmail2FA) {
    return { requires2FA: false };
  }

  const challengeToken = await generateChallengeToken(user.id, env.JWT_SECRET);

  if (hasEmail2FA) {
    const code = generateOTP();
    await db.update(schema.users).set({
      loginOTP: await hashWithSalt(code),
      loginOTPExpiry: new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
    }).where(eq(schema.users.id, user.id)).run();

    return { requires2FA: true, method: hasAuthenticator ? "both" : "email", userId: user.id, totpEnabled: hasAuthenticator, challengeToken };
  }

  return { requires2FA: true, method: "authenticator", userId: user.id, totpEnabled: true, challengeToken };
}

export async function verify2FALogin(env: AuthEnv, userId: string, code: string, method?: "authenticator" | "email", isBackupCode?: boolean, challengeToken?: string) {
  const db = createDb(env.DB);
  if (!challengeToken) throw new Error("2FA challenge token required");
  const decoded = await verifyChallengeToken(challengeToken, env.JWT_SECRET);
  if (!decoded || decoded.userId !== userId) throw new Error("Invalid or expired 2FA challenge");

  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) throw new Error("User not found");
  if (user.blocked) throw new Error("Account blocked");

  const { verifyPassword } = await import("@slyxup/shared");

  if (method === "email" || (!method && !!user.email2FAEnabled)) {
    if (!user.loginOTP) throw new Error("No verification code found. Please log in again.");
    if (user.loginOTPExpiry && new Date(user.loginOTPExpiry) < new Date()) throw new Error("Verification code expired");
    if (!(await verifyHash(code, user.loginOTP))) throw new Error("Invalid verification code");
    await db.update(schema.users).set({ loginOTP: null, loginOTPExpiry: null }).where(eq(schema.users.id, userId)).run();
  } else if (method === "authenticator" || !!user.twoFactorEnabled) {
    if (isBackupCode && user.backupCodes) {
      const storedCodes = JSON.parse(user.backupCodes);
      const result = await verifyBackupCode(storedCodes, code);
      if (!result.valid) throw new Error("Invalid backup code");
      await db.update(schema.users).set({ backupCodes: JSON.stringify(result.remainingCodes) }).where(eq(schema.users.id, userId)).run();
    } else {
      if (!user.twoFactorSecret) throw new Error("2FA not configured");
      const decryptedSecret = await decrypt(user.twoFactorSecret, env.ENCRYPTION_KEY);
      if (!(await verifyTOTP(decryptedSecret, code))) throw new Error("Invalid verification code");
    }
  }

  return { verified: true };
}

export async function initiateEmail2FA(env: AuthEnv, userId: string) {
  const db = createDb(env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) throw new Error("User not found");

  const code = generateOTP();
  await db.update(schema.users).set({
    loginOTP: await hashWithSalt(code),
    loginOTPExpiry: new Date(Date.now() + OTP_EXPIRY_MS).toISOString(),
    updatedAt: new Date().toISOString(),
  }).where(eq(schema.users.id, userId)).run();

  return { code };
}

export { generateChallengeToken, verifyChallengeToken };
