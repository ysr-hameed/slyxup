import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import type { AdminEnv } from "@slyxup/shared";
import { setupOpenApi } from "@slyxup/shared";
import { logger, createHonoErrorHandler } from "@slyxup/logger";
import { auth } from "./middleware/auth";
import dashboard from "./routes/dashboard";
import users from "./routes/users";
import audit from "./routes/audit";

const app = new OpenAPIHono<{ Bindings: AdminEnv }>();

app.use("*", honoLogger());
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization", "X-Admin-Key"] }));
app.onError(createHonoErrorHandler());

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.debug("request", {
    method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - start,
  });
});

app.use("/api/admin/*", auth);

app.route("/api/admin", dashboard);
app.route("/api/admin", users);
app.route("/api/admin", audit);

setupOpenApi(app, {
  title: "Slyxup Admin API",
  version: "1.0.0",
  serverUrl: "http://localhost:8005",
  serverDescription: "Local development",
  pathPrefix: "/api/admin",
});

app.get("/api/admin/docs", swaggerUI({ url: "/api/admin/openapi.json" }));

app.notFound((c) => {
  logger.warn("not_found", { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: "Not found" }, 404);
});

export default app;
