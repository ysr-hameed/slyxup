import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared-types";
import { verifyToken, apiResponseSchema } from "@slyxup/shared-utils";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "get",
  path: "/verify",
  summary: "Verify JWT token",
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
            userId: z.string(),
            email: z.string(),
            platform: z.string(),
          })),
        },
      },
      description: "Token is valid",
    },
    401: { description: "Missing or invalid token" },
  },
});

route.openapi(routeDef, async (c) => {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer "))
    return c.json({ success: false, error: "Missing token" }, 401);

  const payload = await verifyToken(auth.slice(7), c.env.JWT_SECRET);
  if (!payload)
    return c.json({ success: false, error: "Invalid or expired token" }, 401);

  return c.json({
    success: true,
    data: { userId: payload.sub, email: payload.email, platform: payload.platform },
  });
});

export default route;
