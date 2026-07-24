import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import type { StorageEnv } from "@slyxup/shared";
import { setupOpenApi } from "@slyxup/shared";
import { logger, createHonoErrorHandler } from "@slyxup/logger";
import upload from "./routes/upload";
import download from "./routes/download";
import list from "./routes/list";

const app = new OpenAPIHono<{ Bindings: StorageEnv }>();

app.use("*", honoLogger());
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "DELETE", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization", "X-API-Key"] }));
app.onError(createHonoErrorHandler());

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.debug("request", { method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - start });
});

app.route("/api/storage", upload);
app.route("/api/storage", download);
app.route("/api/storage", list);

setupOpenApi(app, {
  title: "Slyxup Storage API", version: "1.0.0",
  serverUrl: "http://localhost:8004", serverDescription: "Local development",
  pathPrefix: "/api/storage",
});

app.get("/api/storage/docs", swaggerUI({ url: "/api/storage/openapi.json" }));
app.notFound((c) => {
  logger.warn("not_found", { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: "Not found" }, 404);
});

export default app;
