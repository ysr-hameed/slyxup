import { Hono } from "hono";
import type { AuthEnv, ApiResponse } from "@slyxup/shared-types";
import { createAuthDb, authSchema } from "@slyxup/shared-db";
import { eq } from "drizzle-orm";

const route = new Hono<{ Bindings: AuthEnv }>();

route.post("/logout", async (c) => {
  let body: { token?: string } = {};
  try {
    body = await c.req.json();
  } catch { /* ignore */ }
  if (body.token) {
    const db = createAuthDb(c.env.DB);
    await db.delete(authSchema.sessions).where(eq(authSchema.sessions.token, body.token)).run();
  }
  return c.json<ApiResponse>({ success: true });
});

export default route;
