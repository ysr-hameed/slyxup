import { Hono } from "hono";
import { cors } from "hono/cors";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { urls } from "./db";

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  AUTH_URL: string;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();
app.use("*", cors());
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(JSON.stringify({ method: c.req.method, path: c.req.path, status: c.res.status, ms }));
});

const secret = (c: any) => new TextEncoder().encode(c.env.JWT_SECRET);
const uid = () => crypto.randomUUID();
const genCode = () => {
  const c = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let r = "";
  for (let i = 0; i < 6; i++) r += c[Math.floor(Math.random() * c.length)];
  return r;
};

async function auth(c: any) {
  const h = c.req.header("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  try {
    const { payload } = await jwtVerify(h.slice(7), secret(c));
    return payload as { sub: string; email: string };
  } catch { return null; }
}

// Create short URL
app.post("/api/urls", async (c) => {
  const user = await auth(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  let body: { target?: string; title?: string };
  try { body = await c.req.json(); } catch { return c.json({ success: false, error: "Invalid JSON" }, 400); }
  if (!body.target) return c.json({ success: false, error: "target required" }, 400);
  try { new URL(body.target); } catch { return c.json({ success: false, error: "Invalid URL" }, 400); }

  const db = drizzle(c.env.DB);
  let code = genCode();
  for (let i = 0; i < 5; i++) {
    const existing = await db.select({ id: urls.id }).from(urls).where(eq(urls.code, code)).get();
    if (!existing) break;
    code = genCode();
  }

  const id = uid();
  await db.insert(urls).values({ id, userId: user.sub, code, target: body.target, title: body.title || null }).run();
  return c.json({ success: true, data: { id, code, target: body.target, title: body.title || null } }, 201);
});

// List user's URLs
app.get("/api/urls", async (c) => {
  const user = await auth(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const list = await db.select().from(urls).where(eq(urls.userId, user.sub)).orderBy(desc(urls.createdAt)).all();
  return c.json({ success: true, data: list });
});

// Delete URL
app.delete("/api/urls/:id", async (c) => {
  const user = await auth(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const link = await db.select().from(urls).where(eq(urls.id, id)).get();
  if (!link || link.userId !== user.sub) return c.json({ success: false, error: "Not found" }, 404);

  await db.delete(urls).where(eq(urls.id, id)).run();
  return c.json({ success: true });
});

// Redirect
app.get("/r/:code", async (c) => {
  const code = c.req.param("code");
  const db = drizzle(c.env.DB);
  const link = await db.select().from(urls).where(eq(urls.code, code)).get();
  if (!link) return c.json({ success: false, error: "Not found" }, 404);

  await db.update(urls).set({ clicks: link.clicks + 1, updatedAt: new Date().toISOString() }).where(eq(urls.id, link.id)).run();
  return c.redirect(link.target, 302);
});

export default app;
