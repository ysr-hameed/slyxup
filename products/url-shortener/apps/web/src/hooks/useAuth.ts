import { useState, useEffect, useCallback } from "react";
import { createSlyxupClient } from "@slyxup/sdk";
import { AUTH_BASE } from "../config";

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  hasPassword?: boolean;
}

const api = createSlyxupClient({ authBaseUrl: AUTH_BASE });

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [jwt, setJwt] = useState<string | null>(() => sessionStorage.getItem("jwt"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jwt) {
      setUser(null);
      setLoading(false);
      return;
    }
    api.auth.me(jwt).then((u) => {
      setUser(u);
      setLoading(false);
    }).catch(() => {
      sessionStorage.removeItem("jwt");
      setJwt(null);
      setUser(null);
      setLoading(false);
    });
  }, [jwt]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    sessionStorage.setItem("jwt", res.jwt);
    setJwt(res.jwt);
    return res;
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const res = await api.auth.register({ email, password, name });
    return res;
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem("jwt");
    setJwt(null);
    setUser(null);
    navigateTo("");
  }, []);

  return { user, jwt, loading, signIn, signUp, signOut };
}

function navigateTo(path: string) {
  window.history.pushState({}, "", path || "/");
  window.dispatchEvent(new Event("popstate"));
}
