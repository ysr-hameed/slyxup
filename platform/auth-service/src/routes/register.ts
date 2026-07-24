import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { registerSchema, apiResponseSchema, hashPassword, generateId, generateToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

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
  const { email, password, name } = c.req.valid("json");

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

  logger.info("user_registered", { userId: id, email });

  return c.json({
    success: true,
    data: { id, email, verificationToken },
  }, 201);
});

export default route;
