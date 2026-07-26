import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema, verifyToken } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "patch",
  path: "/me",
  summary: "Update profile (name, avatar)",
  tags: ["Auth"],
  security: [{ Bearer: [] }],
  request: {
    body: { content: { "application/json": { schema: z.object({
      name: z.string().min(1).max(100).optional(),
      avatarUrl: z.string().url().max(500).optional(),
    }) } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema(z.object({
        id: z.string(), email: z.string(), name: z.string().nullable(),
        avatarUrl: z.string().nullable(), emailVerified: z.boolean(),
      })) } },
      description: "Profile updated",
    },
    401: { description: "Unauthorized" },
  },
});

route.openapi(routeDef, async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Missing authorization header" }, 401);
  }

  const payload = await verifyToken(auth.slice(7), c.env.JWT_SECRET);
  if (!payload) return c.json({ success: false, error: "Invalid or expired token" }, 401);

  const db = createDb(c.env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.sub)).get();
  if (!user) return c.json({ success: false, error: "User not found" }, 404);
  if (user.blocked) return c.json({ success: false, error: "Account is blocked" }, 403);
  if (user.deletedAt) return c.json({ success: false, error: "Account has been deleted" }, 403);

  const updates: Record<string, string> = { updatedAt: new Date().toISOString() };
  const body = c.req.valid("json");
  if (body.name !== undefined) updates.name = body.name;
  if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;

  await db.update(schema.users).set(updates).where(eq(schema.users.id, user.id)).run();

  logger.info("profile_updated", { userId: user.id });

  return c.json({
    success: true,
    data: {
      id: user.id, email: user.email,
      name: body.name ?? user.name,
      avatarUrl: body.avatarUrl ?? user.avatarUrl,
      emailVerified: !!user.emailVerified,
    },
  });
});

export default route;
