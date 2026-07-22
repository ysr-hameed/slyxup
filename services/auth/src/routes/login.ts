import { Hono } from "hono";
import type { AuthEnv, ApiResponse } from "@slyxup/shared-types";
import {
  verifyPassword,
  generateToken,
  generateId,
  signToken,
} from "@slyxup/shared-utils";
import { createAuthDb, authSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";
import { logger } from "@slyxup/shared-logger";

const route = new Hono<{ Bindings: AuthEnv }>();

route.post("/login", async (c) => {
  let body: { email?: string; password?: string; platform?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json<ApiResponse>({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { email, password, platform } = body;
  if (!email || !password)
    return c.json<ApiResponse>({ success: false, error: "Email and password are required" }, 400);

  const db = createAuthDb(c.env.DB);
  const user = await db
    .select()
    .from(authSchema.users)
    .where(eq(authSchema.users.email, email))
    .get();

  if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash)))
    return c.json<ApiResponse>({ success: false, error: "Invalid email or password" }, 401);

  if (platform && user.platform !== platform)
    return c.json<ApiResponse>({ success: false, error: "Invalid email or password" }, 401);

  const sessionId = generateId();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();

  await db.insert(authSchema.sessions).values({
    id: sessionId,
    userId: user.id,
    token,
    expiresAt,
  }).run();

  const jwt = await signToken(
    { sub: user.id, email: user.email, platform: user.platform },
    c.env.JWT_SECRET,
    86400,
  );

  logger.info("user_login", { userId: user.id, email: user.email, platform: user.platform });

  return c.json<ApiResponse<{
    token: string;
    jwt: string;
    user: { id: string; email: string; name: string | null; platform: string };
  }>>({
    success: true,
    data: {
      token,
      jwt,
      user: { id: user.id, email: user.email, name: user.name, platform: user.platform },
    },
  });
});

export default route;
