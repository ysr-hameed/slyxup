import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared-types";
import { verifyToken, apiResponseSchema } from "@slyxup/shared-utils";
import { createAuthDb, authSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "get",
  path: "/me",
  summary: "Get current user profile",
  tags: ["Auth"],
  request: {
    headers: z.object({
      authorization: z.string().optional().describe("Bearer <jwt>"),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: apiResponseSchema(z.object({
            id: z.string(),
            email: z.string(),
            name: z.string().nullable(),
            platform: z.string(),
          })),
        },
      },
      description: "User profile",
    },
    401: { description: "Missing or invalid token" },
    404: { description: "User not found" },
  },
});

route.openapi(routeDef, async (c) => {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer "))
    return c.json({ success: false, error: "Missing token" }, 401);

  const payload = await verifyToken(auth.slice(7), c.env.JWT_SECRET);
  if (!payload)
    return c.json({ success: false, error: "Invalid or expired token" }, 401);

  const db = createAuthDb(c.env.DB);
  const user = await db
    .select({ id: authSchema.users.id, email: authSchema.users.email, name: authSchema.users.name, platform: authSchema.users.platform })
    .from(authSchema.users)
    .where(eq(authSchema.users.id, payload.sub))
    .get();

  if (!user)
    return c.json({ success: false, error: "User not found" }, 404);

  return c.json({ success: true, data: user });
});

export default route;
