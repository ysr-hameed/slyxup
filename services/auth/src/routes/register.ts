import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared-types";
import { hashPassword, generateId, validateEmail, validatePassword, validateName, registerSchema, apiResponseSchema } from "@slyxup/shared-utils";
import { createAuthDb, authSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/shared-logger";
import { sendEmail, welcomeEmail } from "@slyxup/shared-email";

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
      content: { "application/json": { schema: apiResponseSchema(z.object({ userId: z.string() })) } },
      description: "User registered successfully",
    },
    400: { description: "Validation error" },
    409: { description: "Email already registered" },
  },
});

route.openapi(routeDef, async (c) => {
  const { email, password, name, platform } = c.req.valid("json");

  if (!validateEmail(email))
    return c.json({ success: false, error: "Invalid email" }, 400);

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid)
    return c.json({ success: false, error: pwCheck.error }, 400);
  if (name !== undefined && name !== "" && !validateName(name).valid)
    return c.json({ success: false, error: validateName(name).error }, 400);

  const db = createAuthDb(c.env.DB);
  const existing = await db
    .select({ id: authSchema.users.id })
    .from(authSchema.users)
    .where(eq(authSchema.users.email, email))
    .get();

  if (existing)
    return c.json({ success: false, error: "Email already registered" }, 409);

  const id = generateId();
  const passwordHash = await hashPassword(password);

  await db.insert(authSchema.users).values({
    id, email, name: name ?? null, platform, passwordHash,
  }).run();

  logger.info("user_registered", { userId: id, email, platform });

  if (c.env.BREVO_API_KEY) {
    c.executionCtx.waitUntil(
      sendEmail(
        c.env.BREVO_API_KEY,
        c.env.EMAIL_FROM,
        email,
        "Welcome to Slyxup!",
        welcomeEmail(name ?? email),
      ).then((r) => {
        if (r.success) logger.info("welcome_email_sent", { email, messageId: r.messageId });
        else logger.error("welcome_email_failed", { email, error: r.error });
      }),
    );
  }

  return c.json({ success: true, data: { userId: id } }, 201);
});

export default route;
