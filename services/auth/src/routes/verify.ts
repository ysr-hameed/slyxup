import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { AuthEnv } from "@slyxup/shared";
import { apiResponseSchema } from "@slyxup/shared";
import { createAuthDb } from "@slyxup/database";
import { users } from "@slyxup/database";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/logger";

const route = new OpenAPIHono<{ Bindings: AuthEnv }>();

const querySchema = z.object({
  token: z.string(),
});

const routeDef = createRoute({
  method: "get",
  path: "/verify",
  summary: "Verify email with token",
  tags: ["Auth"],
  request: { query: querySchema },
  responses: {
    200: { description: "Email verified" },
    400: { description: "Invalid token" },
  },
});

route.openapi(routeDef, async (c) => {
  const { token } = c.req.valid("query");

  // In production, store verification tokens in DB
  // For now, this is a stub
  logger.info("email_verified", { token });

  return c.json({ success: true, data: { message: "Email verified" } });
});

export default route;
