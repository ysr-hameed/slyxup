import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import type { PaymentEnv } from "@slyxup/shared-types";
import { logger, createHonoErrorHandler } from "@slyxup/shared-logger";
import checkout from "./routes/checkout";
import webhook from "./routes/webhook";
import subscription from "./routes/subscription";
import portal from "./routes/portal";

const app = new Hono<{ Bindings: PaymentEnv }>();

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

app.notFound((c) => {
  logger.warn("not_found", { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: "Not found" }, 404);
});

export default app;
