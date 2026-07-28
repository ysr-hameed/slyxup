import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { user, session, auditLogs } from "@slyxup/database/schema";
import { desc, eq } from "drizzle-orm";
import type { Env, Variables } from "../env";

export const adminRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

adminRouter.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  await next();
});

adminRouter.get("/users", async (c) => {
  const db = drizzle(c.env.DB);
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .all();
  return c.json({ success: true, data: users });
});

adminRouter.get("/users/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const u = await db
    .select()
    .from(user)
    .where(eq(user.id, c.req.param("id")))
    .get();
  if (!u) return c.json({ error: "Not found" }, 404);
  return c.json({ success: true, data: u });
});

adminRouter.get("/sessions", async (c) => {
  const db = drizzle(c.env.DB);
  const sessions = await db
    .select({
      id: session.id,
      userId: session.userId,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    })
    .from(session)
    .orderBy(desc(session.createdAt))
    .all();
  return c.json({ success: true, data: sessions });
});

adminRouter.get("/audit-logs", async (c) => {
  const db = drizzle(c.env.DB);
  const offset = Number(c.req.query("offset") ?? 0);
  const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
  const logs = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
  return c.json({ success: true, data: logs });
});
