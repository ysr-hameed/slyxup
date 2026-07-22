import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const routeDef = createRoute({
  method: "get",
  path: "/verify",
  summary: "Verify email with token",
  tags: ["Auth"],
  request: { query: z.object({ token: z.string() }) },
  responses: {
    200: { description: "Email verified" },
    400: { description: "Invalid token" },
  },
});

route.openapi(routeDef, async (c) => {
  const { token } = c.req.valid("query");
  logger.info("email_verified", { token });
  return c.json({ success: true, data: { message: "Email verified" } });
});

export default route;
