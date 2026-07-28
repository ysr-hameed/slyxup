"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { AuthClient, type SdkConfig } from "@slyxup/auth-sdk";
import type { AuthUser, AuthSession } from "@slyxup/shared";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  session: AuthSession | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  client: AuthClient;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_POLL_INTERVAL = 5 * 60 * 1000;

export function AuthProvider({
  publishableKey,
  baseUrl,
  children,
}: SdkConfig & { children: ReactNode }) {
  const client = useRef(new AuthClient({ publishableKey, baseUrl })).current;
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await client.getSession();
      if (data) {
        setUser(data.user);
        setSession(data.session);
        setStatus("authenticated");
      } else {
        setUser(null);
        setSession(null);
        setStatus("unauthenticated");
      }
    } catch {
      setUser(null);
      setSession(null);
      setStatus("unauthenticated");
    }
  }, [client]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, SESSION_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  const value: AuthContextValue = {
    status,
    user,
    session,
    client,
    refresh,

    signIn: async (email: string, password: string) => {
      await client.signIn({ email, password });
      await refresh();
    },

    signUp: async (email: string, password: string, name: string) => {
      await client.signUp({ email, password, name });
      await refresh();
    },

    signOut: async () => {
      await client.signOut();
      setUser(null);
      setSession(null);
      setStatus("unauthenticated");
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
