import type { MiddlewareHandler } from "hono";
import type { Env, Variables } from "../env";
import { drizzle } from "drizzle-orm/d1";
import { auditLogs } from "@slyxup/database/schema";
import { generateId } from "@slyxup/shared";

export function auditLog(event: string): MiddlewareHandler<{
  Bindings: Env;
  Variables: Variables;
}> {
  return async (c, next) => {
    await next();
    const user = c.get("user");
    if (c.res.status >= 200 && c.res.status < 300) {
      try {
        const db = drizzle(c.env.DB);
        await db.insert(auditLogs).values({
          id: generateId("log"),
          event,
          userId: user?.id ?? null,
          ipAddress: c.req.header("cf-connecting-ip") ?? null,
          userAgent: c.req.header("user-agent") ?? null,
          metadata: JSON.stringify({ method: c.req.method, path: c.req.path }),
          createdAt: new Date().toISOString(),
        });
      } catch {}
    }
  };
}
