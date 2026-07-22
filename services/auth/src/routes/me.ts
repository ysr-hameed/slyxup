import { Hono } from "hono";
import type { AuthEnv, ApiResponse } from "@slyxup/shared-types";
import { verifyToken } from "@slyxup/shared-utils";
import { createAuthDb, authSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";

const route = new Hono<{ Bindings: AuthEnv }>();

route.get("/me", async (c) => {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer "))
    return c.json<ApiResponse>({ success: false, error: "Missing token" }, 401);

  const payload = await verifyToken(auth.slice(7), c.env.JWT_SECRET);
  if (!payload)
    return c.json<ApiResponse>({ success: false, error: "Invalid or expired token" }, 401);

  const db = createAuthDb(c.env.DB);
  const user = await db
    .select({ id: authSchema.users.id, email: authSchema.users.email, name: authSchema.users.name })
    .from(authSchema.users)
    .where(eq(authSchema.users.id, payload.sub))
    .get();

  if (!user)
    return c.json<ApiResponse>({ success: false, error: "User not found" }, 404);

  return c.json<ApiResponse<{ id: string; email: string; name: string | null }>>({
    success: true,
    data: user,
  });
});

export default route;
