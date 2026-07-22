import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import type { BillingEnv } from "@slyxup/shared";
import { setupOpenApi } from "@slyxup/shared";
import { logger, createHonoErrorHandler } from "@slyxup/logger";
import plans from "./routes/plans";
import checkout from "./routes/checkout";
import portal from "./routes/portal";
import subscription from "./routes/subscription";
import webhook from "./routes/webhook";

const app = new OpenAPIHono<{ Bindings: BillingEnv }>();

app.use("*", honoLogger());
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization", "X-Platform", "X-Admin-Key"] }));
app.onError(createHonoErrorHandler());

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.debug("request", { method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - start });
});

app.route("/api/billing", plans);
app.route("/api/billing", checkout);
app.route("/api/billing", portal);
app.route("/api/billing", subscription);
app.route("/api/billing", webhook);

setupOpenApi(app, {
  title: "Slyxup Billing API",
  version: "1.0.0",
  serverUrl: "http://localhost:8001",
  serverDescription: "Local development",
  pathPrefix: "/api/billing",
});

app.get("/api/billing/docs", swaggerUI({ url: "/api/billing/openapi.json" }));

app.notFound((c) => {
  logger.warn("not_found", { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: "Not found" }, 404);
});

export default app;
