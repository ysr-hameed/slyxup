interface RateLimitConfig {
  max: number;
  window: number;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(config: RateLimitConfig) {
  return async (c: any, next: () => Promise<void>) => {
    const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "unknown";
    const key = `${ip}:${c.req.path}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);
    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + config.window });
      return next();
    }

    if (entry.count >= config.max) {
      return c.json({ success: false, error: "Too many requests. Try again later." }, 429);
    }

    entry.count++;
    return next();
  };
}

const defaultRateLimit = rateLimit({ max: 60, window: 60000 });

export function applyDefaultRateLimit(c: any, next: () => Promise<void>) {
  return defaultRateLimit(c, next);
}

export function d1RateLimit(config: RateLimitConfig) {
  return async (c: any, next: () => Promise<void>) => {
    const db = c.env?.DB as D1Database | undefined;
    if (!db) return applyDefaultRateLimit(c, next);

    const ip = c.req.header("CF-Connecting-IP") ?? c.req.header("X-Forwarded-For") ?? "unknown";
    const path = c.req.path;
    const now = Date.now();
    const windowStart = Math.floor(now / config.window) * config.window;

    try {
      await db
        .prepare("INSERT INTO rate_limits (ip, route, count, window_start) VALUES (?, ?, 1, ?) ON CONFLICT(ip, route, window_start) DO UPDATE SET count = count + 1")
        .bind(ip, path, windowStart)
        .run();

      const row = await db
        .prepare("SELECT count FROM rate_limits WHERE ip = ? AND route = ? AND window_start = ?")
        .bind(ip, path, windowStart)
        .first<{ count: number }>();

      const actualCount = row?.count ?? 1;
      const remaining = config.max - actualCount;
      const resetEpoch = Math.ceil((windowStart + config.window) / 1000);

      c.header("X-RateLimit-Limit", String(config.max));
      c.header("X-RateLimit-Remaining", String(Math.max(0, remaining)));
      c.header("X-RateLimit-Reset", String(resetEpoch));

      if (actualCount > config.max) {
        return c.json({ success: false, error: "Too many requests. Try again later." }, 429);
      }

      return next();
    } catch {
      return next();
    }
  };
}

export function requireApiKey(c: any, next: () => Promise<void>) {
  const key = c.req.header("X-API-Key");
  if (!key || key !== c.env?.API_KEY) {
    return c.json({ success: false, error: "Invalid or missing API key" }, 401);
  }
  return next();
}

export function requireAdminKey(c: any, next: () => Promise<void>) {
  const key = c.req.header("X-Admin-Key");
  if (!key || key !== c.env?.ADMIN_KEY) {
    return c.json({ success: false, error: "Invalid or missing admin key" }, 401);
  }
  return next();
}

export function requireJwt(c: any, next: () => Promise<void>) {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "Missing authorization header" }, 401);
  }
  return next();
}


