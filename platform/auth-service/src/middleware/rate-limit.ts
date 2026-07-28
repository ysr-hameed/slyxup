import type { Context, Next } from "hono";
import type { AuthEnv } from "@slyxup/shared";

interface RateLimitConfig {
  max: number;
  window: number;
}

export function d1RateLimit(config: RateLimitConfig) {
  return async (c: Context<{ Bindings: AuthEnv }>, next: Next) => {
    const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "unknown";
    const path = c.req.path;
    const now = Date.now();
    const windowStart = Math.floor(now / config.window) * config.window;

    const db = c.env.DB;
    const row = await db
      .prepare("SELECT count FROM rate_limits WHERE ip = ? AND route = ? AND window_start = ?")
      .bind(ip, path, windowStart)
      .first<{ count: number }>();

    const remaining = row ? config.max - row.count : config.max;
    const resetAt = windowStart + config.window;
    const resetEpoch = Math.ceil(resetAt / 1000);

    c.header("X-RateLimit-Limit", String(config.max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, remaining)));
    c.header("X-RateLimit-Reset", String(resetEpoch));

    if (!row) {
      await db
        .prepare("INSERT OR IGNORE INTO rate_limits (ip, route, count, window_start) VALUES (?, ?, 1, ?)")
        .bind(ip, path, windowStart)
        .run();
      return next();
    }

    if (row.count >= config.max) {
      return c.json({ success: false, error: "Too many requests. Try again later." }, 429);
    }

    await db
      .prepare("UPDATE rate_limits SET count = count + 1 WHERE ip = ? AND route = ? AND window_start = ?")
      .bind(ip, path, windowStart)
      .run();

    return next();
  };
}

const defaultConfig: RateLimitConfig = { max: 60, window: 60000 };

export function applyRateLimit(c: Context<{ Bindings: AuthEnv }>, next: Next) {
  return d1RateLimit(defaultConfig)(c, next);
}
