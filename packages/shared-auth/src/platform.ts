import type { Context, Next } from "hono";

export function requirePlatform(c: Context, next: Next) {
  const platform = c.get("platform") as string | undefined;
  if (!platform) {
    return c.json({ success: false, error: "Platform not found in token" }, 403);
  }
  return next();
}
