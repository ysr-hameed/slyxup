import { useState, useEffect } from "react";
import { createSlyxupClient } from "@slyxup/sdk";
import { AuthPage } from "./pages/AuthPage";
import { VerifyEmail } from "./pages/VerifyEmail";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Dashboard } from "./pages/Dashboard";
import { Billing } from "./pages/Billing";
import { AUTH_BASE } from "./components/Layout";

const api = createSlyxupClient({
  authBaseUrl: AUTH_BASE,
});

type Page = "auth" | "verify" | "forgot-password" | "reset-password" | "dashboard" | "billing";

function getPage(): Page {
  const path = window.location.pathname;
  if (path === "/forgot-password") return "forgot-password";
  if (path === "/reset-password") return "reset-password";
  if (path === "/verify-email") return "verify";
  if (path === "/billing") return "billing";
  if (path === "/dashboard") return "dashboard";
  return "auth";
}

function navigate(page: Page) {
  const paths: Record<string, string> = {
    auth: "/", verify: "/verify-email", "forgot-password": "/forgot-password",
    "reset-password": "/reset-password", dashboard: "/dashboard", billing: "/billing",
  };
  window.history.pushState({}, "", paths[page] || "/");
  window.dispatchEvent(new Event("popstate"));
}

export function App() {
  const [page, setPage] = useState<Page>(getPage);
  const [jwt, setJwt] = useState<string | null>(() => sessionStorage.getItem("jwt"));
  const [pendingEmail, setPendingEmail] = useState<string | undefined>();
  const [user, setUser] = useState<{ id: string; name?: string; email: string } | null>(null);

  useEffect(() => {
    const handler = () => setPage(getPage());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    if (jwt) {
      api.auth.me(jwt).then(setUser).catch(() => {
        sessionStorage.removeItem("jwt");
        setJwt(null);
        setUser(null);
        navigate("auth");
      });
    }
  }, [jwt]);

  const handleLogin = (token: string) => {
    sessionStorage.setItem("jwt", token);
    setJwt(token);
    navigate("dashboard");
  };

  const handleRegistered = (email: string) => {
    setPendingEmail(email);
    navigate("verify");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("jwt");
    setJwt(null);
    setUser(null);
    navigate("auth");
  };

  if (!jwt) {
    switch (page) {
      case "verify":
        return <VerifyEmail email={pendingEmail} />;
      case "forgot-password":
        return <ForgotPassword />;
      case "reset-password":
        return <ResetPassword />;
      default:
        return <AuthPage onLogin={handleLogin} onRegistered={handleRegistered} />;
    }
  }

  switch (page) {
    case "billing":
      return <Billing jwt={jwt} user={user} onLogout={handleLogout} />;
    default:
      return <Dashboard jwt={jwt} user={user} onLogout={handleLogout} />;
  }
}
