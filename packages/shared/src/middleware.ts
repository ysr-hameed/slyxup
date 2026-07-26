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
