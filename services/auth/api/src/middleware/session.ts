import type { MiddlewareHandler } from "hono";
import type { Env, Variables } from "../env";
import { createAuth } from "../lib/auth";

export const sessionMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: Variables;
}> = async (c, next) => {
  const auth = createAuth(c.env);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  c.set("user", {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    emailVerified: session.user.emailVerified,
    image: session.user.image ?? null,
  });
  c.set("session", {
    id: session.session.id,
    userId: session.session.userId,
    expiresAt: session.session.expiresAt.toISOString(),
  });
  await next();
};
