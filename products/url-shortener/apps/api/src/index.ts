import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { urls } from "./schema";
import { createSlyxupClient } from "@slyxup/sdk";

interface AuthUser { id: string; email: string; name: string | null; avatarUrl?: string | null; }

type Env = {
  DB: D1Database;
  AUTH_SERVICE_URL: string;
  BILLING_SERVICE_URL: string;
  EMAIL_SERVICE_URL: string;
  ANALYTICS_SERVICE_URL: string;
  STORAGE_SERVICE_URL: string;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", cors({ origin: "*" }));
app.onError((err, c) => {
  console.error(err.message);
  return c.json({ success: false, error: "Internal server error" }, 500);
});

function api(c: any) {
  return createSlyxupClient({
    authBaseUrl: c.env.AUTH_SERVICE_URL,
    billingBaseUrl: c.env.BILLING_SERVICE_URL,
    emailBaseUrl: c.env.EMAIL_SERVICE_URL,
    analyticsBaseUrl: c.env.ANALYTICS_SERVICE_URL,
    storageBaseUrl: c.env.STORAGE_SERVICE_URL,
  });
}

async function getUser(c: any): Promise<AuthUser | null> {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return await api(c).auth.me(auth.slice(7));
  } catch {
    return null;
  }
}

function generateId(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generateSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let slug = "";
  for (let i = 0; i < 6; i++) slug += chars[Math.floor(Math.random() * chars.length)];
  return slug;
}

app.post("/api/url", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const body = await c.req.json();
  const originalUrl = body.url;
  if (!originalUrl) return c.json({ success: false, error: "URL required" }, 400);
  try { new URL(originalUrl); } catch { return c.json({ success: false, error: "Invalid URL" }, 400); }

  const client = api(c);
  let plan = null;
  try {
    const subscription = await client.billing.getSubscription(user.id);
    plan = subscription.status;
  } catch { /* no subscription — free tier */ }

  const db = drizzle(c.env.DB);
  const slug = generateSlug();
  const now = new Date().toISOString();
  const id = generateId();

  await db.insert(urls).values({ id, slug, originalUrl, userId: user.id, clicks: 0, createdAt: now, updatedAt: now }).run();

  client.analytics.trackEvent({ name: "url_created", platform: "url-shortener", user_id: user.id, properties: { slug } }).catch(() => {});

  return c.json({ success: true, data: { id, slug, shortUrl: `http://localhost:9000/${slug}`, originalUrl, plan } });
});

app.get("/api/url", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  const list = await db.select().from(urls).where(eq(urls.userId, user.id)).all();
  return c.json({ success: true, data: list });
});

app.delete("/api/url/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");
  const url = await db.select().from(urls).where(eq(urls.id, id)).get();
  if (!url || url.userId !== user.id) return c.json({ success: false, error: "Not found" }, 404);
  await db.delete(urls).where(eq(urls.id, id)).run();
  return c.json({ success: true });
});

app.get("/:slug", async (c) => {
  const db = drizzle(c.env.DB);
  const slug = c.req.param("slug");
  const url = await db.select().from(urls).where(eq(urls.slug, slug)).get();
  if (!url) return c.text("Not found", 404);

  const now = new Date().toISOString();
  await db.update(urls).set({ clicks: url.clicks + 1, updatedAt: now }).where(eq(urls.id, url.id)).run();

  api(c).analytics.trackPageView({ path: `/${slug}`, platform: "url-shortener" }).catch(() => {});

  return c.redirect(url.originalUrl, 302);
});

export default app;
