import { Hono } from "hono";
import type { AuthEnv, ApiResponse } from "@slyxup/shared-types";
import {
  hashPassword,
  generateId,
  validateEmail,
  validatePassword,
  validateName,
} from "@slyxup/shared-utils";
import { createAuthDb, authSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/shared-logger";
import { sendEmail, welcomeEmail } from "@slyxup/shared-email";

const route = new Hono<{ Bindings: AuthEnv }>();

route.post("/register", async (c) => {
  let body: { email?: string; password?: string; name?: string; platform?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json<ApiResponse>({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { email, password, name } = body;
  const platform = body.platform || "default";

  if (!email || !password)
    return c.json<ApiResponse>({ success: false, error: "Email and password are required" }, 400);

  if (!validateEmail(email))
    return c.json<ApiResponse>({ success: false, error: "Invalid email" }, 400);

  const pwCheck = validatePassword(password);
  if (!pwCheck.valid)
    return c.json<ApiResponse>({ success: false, error: pwCheck.error }, 400);
  if (name !== undefined && name !== "" && !validateName(name).valid)
    return c.json<ApiResponse>({ success: false, error: validateName(name).error }, 400);

  const db = createAuthDb(c.env.DB);
  const existing = await db
    .select({ id: authSchema.users.id })
    .from(authSchema.users)
    .where(eq(authSchema.users.email, email))
    .get();

  if (existing)
    return c.json<ApiResponse>({ success: false, error: "Email already registered" }, 409);

  const id = generateId();
  const passwordHash = await hashPassword(password);

  await db.insert(authSchema.users).values({
    id,
    email,
    name: name ?? null,
    platform,
    passwordHash,
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
      ).then((r: { success: boolean; messageId?: string; error?: string }) => {
        if (r.success) logger.info("welcome_email_sent", { email, messageId: r.messageId });
        else logger.error("welcome_email_failed", { email, error: r.error });
      }),
    );
  }

  return c.json<ApiResponse<{ userId: string }>>(
    { success: true, data: { userId: id } },
    201,
  );
});

export default route;
