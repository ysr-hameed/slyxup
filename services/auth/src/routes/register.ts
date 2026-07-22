import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv, ApiResponse } from "@slyxup/shared-types";
import { hashPassword, generateId, validateEmail, validatePassword, validateName, registerSchema, apiResponseSchema, signToken } from "@slyxup/shared-utils";
import { createAuthDb, authSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/shared-logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/register",
  summary: "Register a new user (SSO)",
  tags: ["Auth"],
  request: {
    body: { content: { "application/json": { schema: registerSchema } } },
  },
  responses: {
    201: {
      content: { "application/json": { schema: apiResponseSchema(z.object({ userId: z.string(), jwt: z.string() })) } },
      description: "User registered",
    },
    400: { description: "Validation error" },
    409: { description: "Email already registered" },
  },
});

route.openapi(routeDef, async (c) => {
  const { email, password, name } = c.req.valid("json");

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
    id, email, name: name ?? null, passwordHash,
  }).run();

  logger.info("user_registered", { userId: id, email });

  const jwt = await signToken(
    { sub: id, email, platform_id: "default" },
    c.env.JWT_SECRET, 86400,
  );

  return c.json({ success: true, data: { userId: id, jwt } }, 201);
});

export default route;
