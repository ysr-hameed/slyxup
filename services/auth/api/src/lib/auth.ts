import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "@slyxup/database/schema";
import { sendVerificationEmail, sendResetPasswordEmail } from "./email";
import type { Env } from "../env";

export function createAuth(env: Env) {
  const db = drizzle(env.DB, { schema });
  const isProduction = (env.NODE_ENV || env.ENVIRONMENT) === "production";

  const trustedOrigins: string[] = [];
  if (env.BETTER_AUTH_TRUSTED_ORIGINS) {
    trustedOrigins.push(...env.BETTER_AUTH_TRUSTED_ORIGINS.split(","));
  }
  if (!isProduction) {
    trustedOrigins.push(env.FRONTEND_URL || "http://localhost:3000");
  }

  const baseURL = env.API_BASE_URL || env.BETTER_AUTH_URL;
  const isSecure = baseURL.startsWith("https://") || isProduction;

  return betterAuth({
    database: drizzleAdapter(db, { provider: "sqlite" }),
    baseURL,
    secret: env.BETTER_AUTH_SECRET,

    appName: "SlyxUp",

    trustedOrigins,
    emailVerification: {
      sendVerificationEmail: async ({ user, url }: { user: { email: string; name?: string }; url: string; token: string }) => {
        await sendVerificationEmail(env, user, url);
      },
    },
    forgotPassword: {
      sendResetPasswordEmail: async ({ user, url }: { user: { email: string; name?: string }; url: string; token: string }) => {
        await sendResetPasswordEmail(env, user, url);
      },
    },

    advanced: {
      disableCSRFCheck: !isProduction,
      crossSubDomainCookies: {
        enabled: true,
      },
      defaultCookieAttributes: {
        secure: isSecure,
        sameSite: "lax",
      },
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
      },
    },

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
        enabled: !!env.GOOGLE_CLIENT_ID,
      },
      github: {
        clientId: env.GITHUB_CLIENT_ID ?? "",
        clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
        enabled: !!env.GITHUB_CLIENT_ID,
      },
    },

    user: {
      changeEmail: {
        enabled: true,
      },
      deleteUser: {
        enabled: true,
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 5,
    },

    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
