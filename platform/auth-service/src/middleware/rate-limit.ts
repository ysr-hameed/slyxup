import { d1RateLimit as sharedD1RateLimit } from "@slyxup/shared";
import type { Context, Next } from "hono";

export function d1RateLimit(config: { max: number; window: number }) {
  return sharedD1RateLimit(config);
}

export function applyRateLimit(c: Context, next: Next) {
  return sharedD1RateLimit({ max: 60, window: 60000 })(c, next);
}
