import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "./api";

interface User {
  id: string; email: string; name: string | null; platform: string;
}

interface AuthState {
  jwt: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [jwt, setJwt] = useState<string | null>(() => localStorage.getItem("jwt"));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jwt) {
      api.auth.me(jwt).then((res: any) => {
        if (res.success) setUser(res.data);
        else { localStorage.removeItem("jwt"); setJwt(null); }
        setLoading(false);
      });
    } else setLoading(false);
  }, [jwt]);

  const login = async (email: string, password: string) => {
    const res: any = await api.auth.login({ email, password });
    if (res.success) {
      localStorage.setItem("jwt", res.data.jwt);
      setJwt(res.data.jwt);
      setUser(res.data.user);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  const register = async (email: string, password: string, name?: string) => {
    const res: any = await api.auth.register({ email, password, name });
    if (res.success) return { success: true };
    return { success: false, error: res.error };
  };

  const logout = () => {
    localStorage.removeItem("jwt"); setJwt(null); setUser(null);
    api.auth.logout(jwt ?? "");
  };

  return (
    <AuthCtx.Provider value={{ jwt, user, loading, login, register, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
