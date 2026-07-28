import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { registerSchema, apiResponseSchema, hashPassword, generateId, generateToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { verificationEmailHtml } from "../email";
import { logger } from "@slyxup/logger";
import { logAudit } from "../middleware/audit";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/register",
  summary: "Register a new user",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: registerSchema } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: apiResponseSchema(z.object({ id: z.string(), email: z.string() })) } },
      description: "User created",
    },
    400: { description: "Validation error" },
    409: { description: "Email already exists" },
  },
});

route.openapi(routeDef, async (c) => {
  const { email, password, name, platform } = c.req.valid("json");

  const db = createDb(c.env.DB);
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).get();

  if (existing) {
    return c.json({ success: false, error: "Email already registered" }, 409);
  }

  const passwordHash = await hashPassword(password);
  const id = generateId();
  const verificationToken = generateToken();
  const now = new Date().toISOString();

  await db.insert(schema.users).values({
    id, email, name: name ?? null, passwordHash,
    emailVerificationToken: verificationToken,
    emailVerified: 0,
    createdAt: now, updatedAt: now,
  }).run();

  if (platform) {
    let platformRow = await db.select().from(schema.platforms).where(eq(schema.platforms.slug, platform)).get();
    if (!platformRow) {
      const platformId = generateId();
      await db.insert(schema.platforms).values({
        id: platformId, slug: platform, name: platform,
        createdAt: now,
      }).run();
      platformRow = { id: platformId, slug: platform, name: platform, domain: null, status: "active", createdAt: now };
    }
    await db.insert(schema.platformMemberships).values({
      id: generateId(), userId: id, platformId: platformRow.id, role: "member", createdAt: now,
    }).run();
  }

  const verifyLink = `${c.env.APP_DOMAIN}/verify-email?token=${verificationToken}`;
  fetch(`${c.env.EMAIL_SERVICE_URL}/api/email/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": c.env.API_KEY },
    body: JSON.stringify({
      to: [email],
      subject: "Verify your email - SlyxUp",
      html: verificationEmailHtml(verifyLink),
    }),
  }).catch((err) => {
    logger.error("email_send_failed", { error: String(err), to: email, type: "verification" });
  });

  if (c.env.ENVIRONMENT === "development") {
    logger.info("dev_verification_link", { verifyLink });
  }

  logAudit(c, "user_registered", id, `email=${email}`);
  logger.info("user_registered", { userId: id, email });

  return c.json({
    success: true,
    data: { id, email },
  }, 201);
});

export default route;
