import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { drizzle } from "drizzle-orm/d1";
import { applications } from "@slyxup/database/schema";
import { eq } from "drizzle-orm";
import { generateId, generatePublishableKey, generateSecretKey } from "@slyxup/shared";
import { auditLog } from "../middleware/audit-log";
import type { Env, Variables } from "../env";

const createAppSchema = z.object({
  name: z.string().min(2).max(64),
  slug: z.string().min(2).max(32).regex(/^[a-z0-9-]+$/),
  domain: z.string().url().optional(),
  allowedOrigins: z.array(z.string()).default([]),
  redirectUrls: z.array(z.string()).default([]),
});

function sanitizeApp(app: Record<string, unknown>) {
  const { secretKey, ...rest } = app;
  return rest;
}

export const applicationsRouter = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

applicationsRouter.post("/", auditLog("application.create"), zValidator("json", createAppSchema), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const data = c.req.valid("json");
  const db = drizzle(c.env.DB);

  const existing = await db
    .select()
    .from(applications)
    .where(eq(applications.slug, data.slug))
    .get();

  if (existing) return c.json({ error: "Slug already taken" }, 409);

  const now = new Date().toISOString();
  const secretKey = generateSecretKey(data.slug);
  const app = {
    id: generateId("app"),
    name: data.name,
    slug: data.slug,
    domain: data.domain ?? null,
    allowedOrigins: data.allowedOrigins,
    redirectUrls: data.redirectUrls,
    publishableKey: generatePublishableKey(data.slug),
    secretKey,
    ownerId: user.id,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(applications).values(app);

  return c.json(
    {
      success: true,
      data: { ...app, secretKey },
    },
    201,
  );
});

applicationsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const apps = await db
    .select()
    .from(applications)
    .where(eq(applications.ownerId, user.id))
    .all();

  return c.json({ success: true, data: apps.map(sanitizeApp) });
});

applicationsRouter.get("/:id", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const app = await db
    .select()
    .from(applications)
    .where(eq(applications.id, c.req.param("id")))
    .get();

  if (!app) return c.json({ error: "Not found" }, 404);
  if (app.ownerId !== user.id) return c.json({ error: "Forbidden" }, 403);

  return c.json({ success: true, data: sanitizeApp(app) });
});

applicationsRouter.post("/:id/reveal-secret", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const app = await db
    .select()
    .from(applications)
    .where(eq(applications.id, c.req.param("id")))
    .get();

  if (!app) return c.json({ error: "Not found" }, 404);
  if (app.ownerId !== user.id) return c.json({ error: "Forbidden" }, 403);

  return c.json({ success: true, data: { secretKey: app.secretKey } });
});

applicationsRouter.delete("/:id", auditLog("application.delete"), async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const db = drizzle(c.env.DB);
  const app = await db
    .select()
    .from(applications)
    .where(eq(applications.id, c.req.param("id")))
    .get();

  if (!app) return c.json({ error: "Not found" }, 404);
  if (app.ownerId !== user.id) return c.json({ error: "Forbidden" }, 403);

  await db.delete(applications).where(eq(applications.id, app.id));

  return c.json({ success: true });
});
