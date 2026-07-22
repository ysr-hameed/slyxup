import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import type { AnalyticsEnv } from "@slyxup/shared";
import { setupOpenApi } from "@slyxup/shared";
import { logger, createHonoErrorHandler } from "@slyxup/logger";
import events from "./routes/events";
import pageViews from "./routes/pageviews";

const app = new OpenAPIHono<{ Bindings: AnalyticsEnv }>();

app.use("*", honoLogger());
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization"] }));
app.onError(createHonoErrorHandler());

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.debug("request", {
    method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - start,
  });
});

app.route("/api/analytics", events);
app.route("/api/analytics", pageViews);

setupOpenApi(app, {
  title: "Slyxup Analytics API",
  version: "1.0.0",
  serverUrl: "http://localhost:8003",
  serverDescription: "Local development",
  pathPrefix: "/api/analytics",
});

app.get("/api/analytics/docs", swaggerUI({ url: "/api/analytics/openapi.json" }));

app.notFound((c) => {
  logger.warn("not_found", { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: "Not found" }, 404);
});

export default app;
