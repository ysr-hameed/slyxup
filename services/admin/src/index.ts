import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import type { AdminEnv } from "@slyxup/shared-types";
import { logger, createHonoErrorHandler } from "@slyxup/shared-logger";
import auth from "./routes/auth";
import users from "./routes/users";
import audit from "./routes/audit";
import tests from "./routes/tests";

const app = new OpenAPIHono<{ Bindings: AdminEnv }>();

app.use("*", honoLogger());
app.use("/api/admin/*", cors());
app.onError(createHonoErrorHandler());

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.debug("request", {
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    ms: Date.now() - start,
  });
});

app.route("/api/admin", auth);
app.route("/api/admin/users", users);
app.route("/api/admin/audit", audit);
app.route("/api/admin/test", tests);

app.doc("/api/admin/openapi.json", {
  openapi: "3.0.0",
  info: { title: "Slyxup Admin API", version: "1.0.0" },
  servers: [{ url: "http://localhost:8002", description: "Local dev" }],
});

app.get("/api/admin/docs", swaggerUI({ url: "/api/admin/openapi.json" }));

app.notFound((c) => {
  logger.warn("not_found", { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: "Not found" }, 404);
});

export default app;
