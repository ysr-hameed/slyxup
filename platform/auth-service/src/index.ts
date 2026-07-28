import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { swaggerUI } from "@hono/swagger-ui";
import type { AuthEnv } from "@slyxup/shared";
import { setupOpenApi, corsOrigin } from "@slyxup/shared";
import { logger, createHonoErrorHandler } from "@slyxup/logger";
import register from "./routes/register";
import login from "./routes/login";
import logout from "./routes/logout";
import refresh from "./routes/refresh";
import logoutAll from "./routes/logout-all";
import me from "./routes/me";
import verify from "./routes/verify";
import google from "./routes/google";
import sessions from "./routes/sessions";
import forgotPassword from "./routes/forgot-password";
import resetPassword from "./routes/reset-password";
import changePassword from "./routes/change-password";
import updateProfile from "./routes/update-profile";
import resendVerification from "./routes/resend-verification";
import deleteAccount from "./routes/delete-account";
import admin from "./routes/admin";
import twofa from "./routes/twofa";
import { d1RateLimit } from "./middleware/rate-limit";

const app = new OpenAPIHono<{ Bindings: AuthEnv }>();

app.use("*", honoLogger());
app.use("*", cors({ origin: corsOrigin, allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"], allowHeaders: ["Content-Type", "Authorization", "X-Platform", "X-Admin-Key"] }));
app.onError(createHonoErrorHandler());

// Stricter rate limit for auth endpoints (20 req/min)
app.use("/api/auth/login", d1RateLimit({ max: 20, window: 60000 }));
app.use("/api/auth/register", d1RateLimit({ max: 10, window: 60000 }));
app.use("/api/auth/forgot-password", d1RateLimit({ max: 5, window: 60000 }));
app.use("/api/auth/resend-verification", d1RateLimit({ max: 5, window: 60000 }));
app.use("/api/auth/login-2fa", d1RateLimit({ max: 10, window: 60000 }));
app.use("/api/auth/verify-2fa", d1RateLimit({ max: 10, window: 60000 }));
app.use("/api/auth/2fa/*", d1RateLimit({ max: 20, window: 60000 }));
app.use("/api/auth/*", d1RateLimit({ max: 60, window: 60000 }));

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.debug("request", { method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - start });
});

app.route("/api/auth", register);
app.route("/api/auth", login);
app.route("/api/auth", logout);
app.route("/api/auth", refresh);
app.route("/api/auth", logoutAll);
app.route("/api/auth", me);
app.route("/api/auth", verify);
app.route("/api/auth", google);
app.route("/api/auth", sessions);
app.route("/api/auth", forgotPassword);
app.route("/api/auth", resetPassword);
app.route("/api/auth", changePassword);
app.route("/api/auth", updateProfile);
app.route("/api/auth", resendVerification);
app.route("/api/auth", deleteAccount);
app.route("/api/auth", admin);
app.route("/api/auth", twofa);

setupOpenApi(app, {
  title: "Slyxup Auth API",
  version: "1.0.0",
  serverUrl: "http://localhost:8000",
  serverDescription: "Local development",
  pathPrefix: "/api/auth",
});

app.get("/api/auth/docs", swaggerUI({ url: "/api/auth/openapi.json" }));

app.get("/health", (c) => c.json({ status: "ok", service: "auth" }));

app.notFound((c) => {
  logger.warn("not_found", { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: "Not found" }, 404);
});

export default app;
