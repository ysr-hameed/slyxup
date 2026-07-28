import { Hono } from "hono";
import { cors } from "hono/cors";
import { swaggerUI } from "@hono/swagger-ui";
import { createAuth } from "./lib/auth";
import { sessionMiddleware } from "./middleware/session";
import { rateLimit } from "./middleware/rate-limit";
import { applicationsRouter } from "./routes/applications";
import { adminRouter } from "./routes/admin";
import { spec } from "./lib/openapi";
import type { Env, Variables } from "./env";

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

function getCorsOrigins(env: Env): string[] {
  if (env.CORS_ORIGIN) {
    return [env.CORS_ORIGIN];
  }
  if (env.CORS_ORIGIN) {
    return [env.CORS_ORIGIN];
  }

  const isProduction = (env.NODE_ENV || env.ENVIRONMENT) === "production";
  if (isProduction) {
    return ["https://platform.slyxup.in", "https://auth.slyxup.in"];
  }
  return [env.FRONTEND_URL || "http://localhost:5173"];
}

app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const origins = getCorsOrigins(c.env);
      if (!origin || origins.includes(origin)) return origin;
      return origins[0] ?? "";
    },
    allowHeaders: ["Content-Type", "Authorization", "X-Publishable-Key"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

app.on(["GET", "POST"], "/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

app.use("/api/applications/*", rateLimit());
app.use("/api/applications/*", sessionMiddleware);

app.use("/api/admin/*", sessionMiddleware);

app.route("/api/applications", applicationsRouter);
app.route("/api/admin", adminRouter);

app.get("/api/openapi", (c) => {
  return c.json(spec);
});

app.get("/api/docs", swaggerUI({ url: "/api/openapi" }));

app.get("/api/health", (c) => {
  return c.json({ status: "ok", service: "slyxauth" });
});

export default app;
