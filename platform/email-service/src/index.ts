import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import type { EmailEnv } from "@slyxup/shared";
import { setupOpenApi, requireApiKey } from "@slyxup/shared";
import { logger, createHonoErrorHandler } from "@slyxup/logger";
import send from "./routes/send";

const app = new OpenAPIHono<{ Bindings: EmailEnv }>();

app.use("*", honoLogger());
app.use("*", cors({ origin: "*", allowMethods: ["POST", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization", "X-API-Key"] }));
app.onError(createHonoErrorHandler());

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.debug("request", { method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - start });
});

app.use("/api/email/*", requireApiKey);
app.route("/api/email", send);

setupOpenApi(app, {
  title: "Slyxup Email API", version: "1.0.0",
  serverUrl: "http://localhost:8002", serverDescription: "Local development",
  pathPrefix: "/api/email",
});

app.get("/api/email/docs", swaggerUI({ url: "/api/email/openapi.json" }));
app.notFound((c) => {
  logger.warn("not_found", { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: "Not found" }, 404);
});

export default app;
