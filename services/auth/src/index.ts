import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import type { AuthEnv } from "@slyxup/shared-types";
import { logger, createHonoErrorHandler } from "@slyxup/shared-logger";
import register from "./routes/register";
import login from "./routes/login";
import verify from "./routes/verify";
import logout from "./routes/logout";
import me from "./routes/me";
import google from "./routes/google";

const app = new Hono<{ Bindings: AuthEnv }>();

app.use("*", honoLogger());
app.use("*", cors());
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

app.notFound((c) => {
  logger.warn("not_found", { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: "Not found" }, 404);
});

export default app;
