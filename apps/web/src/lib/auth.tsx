import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { api } from "./api";

interface AuthState {
  jwt: string | null;
  user: { id: string; email: string; name: string | null } | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [jwt, setJwt] = useState<string | null>(() => localStorage.getItem("jwt"));
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (jwt) {
      api.auth.me(jwt).then((res) => {
        if (res.success) setUser(res.data);
        else { localStorage.removeItem("jwt"); setJwt(null); }
        setLoading(false);
      });
    } else setLoading(false);
  }, [jwt]);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    if (res.success) {
      localStorage.setItem("jwt", res.data.jwt);
      setJwt(res.data.jwt);
      setUser(res.data.user);
      return true;
    }
    return false;
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await api.auth.register({ email, password, name });
    return res.success;
  };

  const logout = () => {
    localStorage.removeItem("jwt");
    setJwt(null);
    setUser(null);
    api.auth.logout(jwt ?? "");
  };

  return (
    <AuthContext.Provider value={{ jwt, user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
