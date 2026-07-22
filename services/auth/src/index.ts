import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import type { AuthEnv } from "@slyxup/shared-types";
import { logger, createHonoErrorHandler } from "@slyxup/shared-logger";
import register from "./routes/register";
import login from "./routes/login";
import verify from "./routes/verify";
import logout from "./routes/logout";
import me from "./routes/me";
import google from "./routes/google";
import adminUsers from "./routes/admin-users";

const app = new OpenAPIHono<{ Bindings: AuthEnv }>();

app.use("*", honoLogger());
app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization", "X-Platform", "X-Admin-Key"] }));
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

app.route("/api/auth", register);
app.route("/api/auth", login);
app.route("/api/auth", verify);
app.route("/api/auth", logout);
app.route("/api/auth", me);
app.route("/api/auth", google);
app.route("/api/auth/admin", adminUsers);

app.doc("/api/auth/openapi.json", {
  openapi: "3.0.0",
  info: { title: "Slyxup Auth API", version: "1.0.0" },
  servers: [{ url: "http://localhost:8000", description: "Local dev" }],
});

app.get("/api/auth/docs", swaggerUI({ url: "/api/auth/openapi.json" }));

app.notFound((c) => {
  logger.warn("not_found", { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: "Not found" }, 404);
});

export default app;
