import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import type { PaymentEnv } from "@slyxup/shared-types";
import { logger, createHonoErrorHandler } from "@slyxup/shared-logger";
import checkout from "./routes/checkout";
import webhook from "./routes/webhook";
import subscription from "./routes/subscription";
import portal from "./routes/portal";

const app = new OpenAPIHono<{ Bindings: PaymentEnv }>();

app.use("*", honoLogger());
app.use("/api/payment/*", cors());
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

app.route("/api/payment", checkout);
app.route("/api/payment", webhook);
app.route("/api/payment", subscription);
app.route("/api/payment", portal);

app.doc("/api/payment/openapi.json", {
  openapi: "3.0.0",
  info: { title: "Slyxup Payment API", version: "1.0.0" },
  servers: [{ url: "http://localhost:8001", description: "Local dev" }],
});

app.get("/api/payment/docs", swaggerUI({ url: "/api/payment/openapi.json" }));

app.notFound((c) => {
  logger.warn("not_found", { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: "Not found" }, 404);
});

export default app;
