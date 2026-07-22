import { Hono } from "hono";
import type { AuthEnv, ApiResponse } from "@slyxup/shared-types";
import { createAuthDb, authSchema } from "@slyxup/shared-db";
import { eq, and, isNull, like } from "drizzle-orm";
import { logger } from "@slyxup/shared-logger";

const route = new Hono<{ Bindings: AuthEnv }>();

route.use("*", async (c, next) => {
  const apiKey = c.req.header("x-admin-key");
  if (!apiKey || apiKey !== c.env.ADMIN_API_KEY)
    return c.json<ApiResponse>({ success: false, error: "Unauthorized" }, 401);
  await next();
});

route.get("/users", async (c) => {
  const db = createAuthDb(c.env.DB);
  const platform = c.req.query("platform");
  const includeDeleted = c.req.query("includeDeleted") === "true";

  let conditions = [];
  if (platform) conditions.push(eq(authSchema.users.platform, platform));
  if (!includeDeleted) conditions.push(isNull(authSchema.users.deletedAt));

  const users = conditions.length
    ? await db.select().from(authSchema.users).where(and(...conditions)).all()
    : await db.select().from(authSchema.users).all();

  const safe = users.map(({ passwordHash, ...u }) => u);
  return c.json<ApiResponse>({ success: true, data: safe });
});

route.patch("/users/:id/block", async (c) => {
  const id = c.req.param("id");
  const db = createAuthDb(c.env.DB);

  const user = await db.select().from(authSchema.users).where(eq(authSchema.users.id, id)).get();
  if (!user) return c.json<ApiResponse>({ success: false, error: "User not found" }, 404);

  const newBlocked = user.blocked ? 0 : 1;
  await db.update(authSchema.users).set({ blocked: newBlocked, updatedAt: new Date().toISOString() }).where(eq(authSchema.users.id, id)).run();

  logger.info("user_block_toggled", { userId: id, blocked: !!newBlocked, platform: user.platform });
  return c.json<ApiResponse>({ success: true, data: { id, blocked: !!newBlocked } });
});

route.delete("/users/:id", async (c) => {
  const id = c.req.param("id");
  const db = createAuthDb(c.env.DB);

  const user = await db.select().from(authSchema.users).where(eq(authSchema.users.id, id)).get();
  if (!user) return c.json<ApiResponse>({ success: false, error: "User not found" }, 404);
  if (user.deletedAt) return c.json<ApiResponse>({ success: false, error: "User already deleted" }, 400);

  const now = new Date().toISOString();
  await db.update(authSchema.users).set({ deletedAt: now, updatedAt: now }).where(eq(authSchema.users.id, id)).run();

  logger.info("user_deleted", { userId: id, platform: user.platform, email: user.email });
  return c.json<ApiResponse>({ success: true, data: { id, deletedAt: now } });
});

route.patch("/users/:id/restore", async (c) => {
  const id = c.req.param("id");
  const db = createAuthDb(c.env.DB);

  const user = await db.select().from(authSchema.users).where(eq(authSchema.users.id, id)).get();
  if (!user) return c.json<ApiResponse>({ success: false, error: "User not found" }, 404);
  if (!user.deletedAt) return c.json<ApiResponse>({ success: false, error: "User is not deleted" }, 400);

  await db.update(authSchema.users).set({ deletedAt: null, updatedAt: new Date().toISOString() }).where(eq(authSchema.users.id, id)).run();

  logger.info("user_restored", { userId: id, platform: user.platform });
  return c.json<ApiResponse>({ success: true, data: { id, restored: true } });
});

export default route;
