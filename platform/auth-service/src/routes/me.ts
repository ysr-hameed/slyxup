import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { verifyToken, apiResponseSchema } from "@slyxup/shared";
import { createDb } from "../db";
import * as schema from "../schema/index";
import { eq } from "drizzle-orm";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "get",
  path: "/me",
  summary: "Get current user profile",
  tags: ["Auth"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({
            id: z.string(), email: z.string(), name: z.string().nullable(),
            avatarUrl: z.string().nullable(), createdAt: z.string(),
          })),
        },
      },
      description: "User profile",
    },
    401: { description: "Unauthorized" },
  },
});

route.openapi(routeDef, async (c) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return c.json({ success: false, error: "Missing authorization header" }, 401);

  const payload = await verifyToken(authHeader.slice(7), c.env.JWT_SECRET);
  if (!payload) return c.json({ success: false, error: "Invalid or expired token" }, 401);

  const db = createDb(c.env.DB);
  const user = await db.select().from(schema.users).where(eq(schema.users.id, payload.sub)).get();
  if (!user) return c.json({ success: false, error: "User not found" }, 404);
  if (user.blocked) return c.json({ success: false, error: "Account is blocked" }, 403);
  if (user.deletedAt) return c.json({ success: false, error: "Account has been deleted" }, 403);

  return c.json({
    success: true,
    data: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl, createdAt: user.createdAt },
  });
});

export default route;
