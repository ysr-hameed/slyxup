import { Hono } from "hono";
import type { AuthEnv, ApiResponse } from "@slyxup/shared-types";
import { verifyToken } from "@slyxup/shared-utils";

const route = new Hono<{ Bindings: AuthEnv }>();

route.get("/verify", async (c) => {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer "))
    return c.json<ApiResponse>({ success: false, error: "Missing token" }, 401);

  const payload = await verifyToken(auth.slice(7), c.env.JWT_SECRET);
  if (!payload)
    return c.json<ApiResponse>({ success: false, error: "Invalid or expired token" }, 401);

  return c.json<ApiResponse<{ userId: string; email: string }>>({
    success: true,
    data: { userId: payload.sub, email: payload.email },
  });
});

export default route;
