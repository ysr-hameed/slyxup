import type { MiddlewareHandler } from "hono";
import type { Env } from "../env";

const WINDOW = 60;
const MAX_REQUESTS = 100;

export function rateLimit(): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const ip = c.req.header("cf-connecting-ip") ?? "unknown";
    const key = `ratelimit:${ip}:${Math.floor(Date.now() / (WINDOW * 1000))}`;

    const current = await c.env.KV.get(key);
    const count = current ? Number.parseInt(current, 10) : 0;

    if (count >= MAX_REQUESTS) {
      return c.json({ error: "Too many requests" }, 429);
    }

    await c.env.KV.put(key, String(count + 1), {
      expirationTtl: WINDOW,
    });

    await next();
  };
}
