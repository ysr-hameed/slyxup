import { useAuthContext } from "./context";
import type { AuthUser, AuthSession } from "@slyxup/shared";

export function useAuth() {
  const ctx = useAuthContext();
  return {
    isAuthenticated: ctx.status === "authenticated",
    isLoading: ctx.status === "loading",
    signIn: ctx.signIn,
    signUp: ctx.signUp,
    signOut: ctx.signOut,
    refresh: ctx.refresh,
    client: ctx.client,
  };
}

export function useUser(): AuthUser | null {
  const ctx = useAuthContext();
  return ctx.user;
}

export function useSession(): AuthSession | null {
  const ctx = useAuthContext();
  return ctx.session;
}
