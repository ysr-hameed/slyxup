import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { drizzle } from "drizzle-orm/d1";
import { eq, lt, and, sql } from "drizzle-orm";
import { createSlyxupClient } from "@slyxup/sdk";
import { verifyToken, applyDefaultRateLimit } from "@slyxup/shared";
import { createHonoErrorHandler } from "@slyxup/logger";
import { urls } from "./schema";
import { createUrlSchema, paginationSchema } from "./validation";
import { generateId, generateSlug } from "./utils";
import type { Env, PlanLimits } from "./types";
import { FREE_PLAN, PRO_PLAN } from "./types";

const ALLOWED_ORIGINS = [
  /^https:\/\/[a-z0-9-]+\.slyxup\.online$/,
  /^http:\/\/localhost:\d+$/,
];

function corsOrigin(origin: string): string | null {
  if (!origin) return null;
  return ALLOWED_ORIGINS.some((p) => p.test(origin)) ? origin : null;
}

function getClient(c: any) {
  return createSlyxupClient({
    apiKey: c.env.API_KEY,
    authBaseUrl: c.env.AUTH_SERVICE_URL,
    billingBaseUrl: c.env.BILLING_SERVICE_URL,
    analyticsBaseUrl: c.env.ANALYTICS_SERVICE_URL,
  });
}

async function getUser(c: any): Promise<{ id: string; email: string } | null> {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const payload = await verifyToken(token, c.env.JWT_SECRET);
  if (!payload) return null;
  return { id: payload.sub, email: payload.email };
}

async function getPlanLimits(c: any, userId: string): Promise<PlanLimits> {
  try {
    const sub = await getClient(c).billing.getSubscription(userId);
    if (sub.status === "active" || sub.status === "trialing") return PRO_PLAN;
  } catch {}
  return FREE_PLAN;
}

function getShortDomain(c: any): string {
  if (c.env.ENVIRONMENT === "development") return `localhost:9000`;
  return "api-url.slyxup.online";
}

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use("*", cors({ origin: corsOrigin }));
app.use("*", applyDefaultRateLimit);
app.onError(createHonoErrorHandler());

app.notFound((c) => c.json({ success: false, error: "Not found" }, 404));

app.post("/api/url", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const parsed = createUrlSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return c.json({ success: false, error: first?.message || "Validation failed" }, 422);
  }

  const { url: originalUrl, slug: customSlug, title } = parsed.data;
  const plan = await getPlanLimits(c, user.id);
  const db = drizzle(c.env.DB);

  const count = await db.select({ count: sql<number>`count(*)` }).from(urls).where(eq(urls.userId, user.id)).get();
  if (count && count.count >= plan.maxUrls) {
    return c.json({ success: false, error: `Plan limit reached (${plan.maxUrls} URLs). Upgrade to create more.` }, 403);
  }

  let slug = "";
  if (customSlug) {
    if (!plan.customSlug) {
      return c.json({ success: false, error: "Custom slugs require a Pro plan." }, 403);
    }
    const existing = await db.select().from(urls).where(eq(urls.slug, customSlug)).get();
    if (existing) {
      return c.json({ success: false, error: "Slug already taken." }, 409);
    }
    slug = customSlug;
  } else {
    let found = false;
    for (let i = 0; i < 5; i++) {
      const candidate = generateSlug(plan.slugLength);
      const taken = await db.select().from(urls).where(eq(urls.slug, candidate)).get();
      if (!taken) { slug = candidate; found = true; break; }
    }
    if (!found) slug = generateSlug(8);
  }

  const id = generateId();
  const now = new Date().toISOString();
  const expiresAt = plan === FREE_PLAN ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;

  await db.insert(urls).values({
    id, slug, originalUrl, userId: user.id, title, clicks: 0,
    isCustom: customSlug ? 1 : 0, isActive: 1, expiresAt, createdAt: now, updatedAt: now,
  }).run();

  getClient(c).analytics.trackEvent({
    name: "url_created", platform: "url-shortener", user_id: user.id,
    properties: { slug, custom: !!customSlug },
  }).catch(() => {});

  const isDev = c.env.ENVIRONMENT === "development";
  const proto = isDev ? "http" : c.req.header("X-Forwarded-Proto") || "https";
  const shortDomain = getShortDomain(c);
  const shortUrl = `${proto}://${shortDomain}/${slug}`;
  return c.json({
    success: true,
    data: { id, slug, shortUrl, originalUrl, title: title || null, plan: plan === PRO_PLAN ? "pro" : "free", expiresAt },
  });
});

app.get("/api/url", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const parsed = paginationSchema.safeParse(c.req.query());
  const { cursor, limit } = parsed.success ? parsed.data : { cursor: undefined, limit: 20 };
  const db = drizzle(c.env.DB);

  const conditions = [eq(urls.userId, user.id)];
  if (cursor) conditions.push(lt(urls.createdAt, cursor));

  const list = await db.select()
    .from(urls)
    .where(and(...conditions))
    .orderBy(sql`${urls.createdAt} DESC`)
    .limit(limit + 1)
    .all();

  const hasMore = list.length > limit;
  const items = hasMore ? list.slice(0, limit) : list;
  const last = items[items.length - 1];
  const nextCursor = last ? last.createdAt : undefined;

  return c.json({ success: true, data: items, nextCursor });
});

app.delete("/api/url/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  const db = drizzle(c.env.DB);
  const url = await db.select().from(urls).where(eq(urls.id, id)).get();

  if (!url || url.userId !== user.id) return c.json({ success: false, error: "Not found" }, 404);

  await db.delete(urls).where(eq(urls.id, id)).run();
  return c.json({ success: true });
});

app.get("/:slug", async (c) => {
  const slug = c.req.param("slug");
  if (!slug || slug.length > 12) return c.text("Not found", 404);

  const db = drizzle(c.env.DB);
  const url = await db.select().from(urls).where(eq(urls.slug, slug)).get();

  if (!url || !url.isActive) return c.text("Not found", 404);

  if (url.expiresAt && new Date(url.expiresAt) < new Date()) {
    await db.update(urls).set({ isActive: 0, updatedAt: new Date().toISOString() }).where(eq(urls.id, url.id)).run();
    return c.text("Link expired", 410);
  }

  const now = new Date().toISOString();
  await db.update(urls).set({ clicks: url.clicks + 1, updatedAt: now }).where(eq(urls.id, url.id)).run();

  getClient(c).analytics.trackPageView({ path: `/${slug}`, platform: "url-shortener" }).catch(() => {});

  return c.redirect(url.originalUrl, 302);
});

export default app;
