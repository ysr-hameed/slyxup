import { AuthClient, type SdkConfig } from "./client";
import { UnauthorizedError } from "./errors";
import type { AuthUser, AuthSession } from "@slyxup/shared";

type Session = {
  user: AuthUser;
  session: AuthSession;
};

type RequestLike = {
  headers: Headers | Record<string, string>;
};

export function createAuth(config: SdkConfig) {
  const client = new AuthClient(config);

  async function fetchSession(request?: RequestLike): Promise<Session | null> {
    if (!request) return client.getSession();
    const baseUrl = config.baseUrl ?? "http://localhost:8787";
    const res = await fetch(`${baseUrl}/api/auth/get-session`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Publishable-Key": config.publishableKey,
        Cookie: request.headers instanceof Headers
          ? request.headers.get("cookie") ?? ""
          : (request.headers as Record<string, string>).cookie ?? "",
      },
    });
    if (!res.ok) return null;
    return res.json() as Promise<Session>;
  }

  return {
    client,

    auth: fetchSession,

    requireAuth: async (request?: RequestLike): Promise<Session> => {
      const session = await fetchSession(request);
      if (!session) throw new UnauthorizedError();
      return session;
    },

    withAuth: <T>(
      handler: (session: Session) => Promise<T>,
      redirectTo?: string,
    ) => {
      return async (request?: RequestLike): Promise<T | Response> => {
        const session = await fetchSession(request);
        if (!session) {
          const redirectUrl = redirectTo ?? `${config.baseUrl ?? "http://localhost:8787"}/sign-in`;
          return Response.redirect(redirectUrl);
        }
        return handler(session);
      };
    },
  };
}

export type AuthInstance = ReturnType<typeof createAuth>;
