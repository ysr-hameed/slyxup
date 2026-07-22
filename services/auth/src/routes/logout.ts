import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared-types";
import { apiResponseSchema } from "@slyxup/shared-utils";
import { createAuthDb, authSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "post",
  path: "/logout",
  summary: "Logout and invalidate session token",
  tags: ["Auth"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ token: z.string().optional() }),
        },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: apiResponseSchema() } },
      description: "Logged out successfully",
    },
  },
});

route.openapi(routeDef, async (c) => {
  const { token } = c.req.valid("json");
  if (token) {
    const db = createAuthDb(c.env.DB);
    await db.update(authSchema.sessions)
      .set({ revokedAt: new Date().toISOString() })
      .where(eq(authSchema.sessions.token, token))
      .run();
  }
  return c.json({ success: true });
});

export default route;
