import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { OAuthCallback } from "./pages/OAuthCallback";
import { VerifyEmail } from "./pages/VerifyEmail";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Dashboard } from "./pages/Dashboard";
import { Billing } from "./pages/Billing";
import { Settings } from "./pages/Settings";

export type { AuthUser as User } from "./hooks/useAuth";

type Page = "landing" | "login" | "oauth-callback" | "verify" | "forgot-password" | "reset-password" | "dashboard" | "billing" | "settings";

function getPage(): Page {
  const path = window.location.pathname;
  if (path === "/login") return "login";
  if (path === "/oauth-callback") return "oauth-callback";
  if (path === "/oauth/callback") return "oauth-callback";
  if (path === "/forgot-password") return "forgot-password";
  if (path === "/reset-password") return "reset-password";
  if (path === "/verify-email") return "verify";
  if (path === "/billing") return "billing";
  if (path === "/settings") return "settings";
  if (path === "/dashboard") return "dashboard";
  return "landing";
}

function navigate(page: Page) {
  const paths: Record<string, string> = {
    landing: "/", login: "/login", "oauth-callback": "/oauth/callback", verify: "/verify-email",
    "forgot-password": "/forgot-password", "reset-password": "/reset-password",
    dashboard: "/dashboard", billing: "/billing", settings: "/settings",
  };
  window.history.pushState({}, "", paths[page] || "/");
  window.dispatchEvent(new Event("popstate"));
}

export function App() {
  const [page, setPage] = useState<Page>(getPage);
  const [pendingEmail, setPendingEmail] = useState<string | undefined>();
  const { user, jwt, loading, signOut } = useAuth();

  useEffect(() => {
    const handler = () => setPage(getPage());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  useEffect(() => {
    if (!loading && !jwt && page !== "login" && page !== "landing" && page !== "verify" && page !== "forgot-password" && page !== "reset-password" && page !== "oauth-callback") {
      navigate("landing");
    }
  }, [loading, jwt, page]);

  if (loading) return null;

  if (!jwt || page === "verify" || page === "forgot-password" || page === "reset-password" || page === "oauth-callback") {
    switch (page) {
      case "login":
        return <Login />;
      case "oauth-callback":
        return <OAuthCallback />;
      case "verify":
        return <VerifyEmail email={pendingEmail} />;
      case "forgot-password":
        return <ForgotPassword />;
      case "reset-password":
        return <ResetPassword />;
      default:
        return <Landing />;
    }
  }

  switch (page) {
    case "billing":
      return <Billing jwt={jwt} user={user} onLogout={signOut} />;
    case "settings":
      return <Settings jwt={jwt} user={user} onLogout={signOut} />;
    default:
      return <Dashboard jwt={jwt} user={user} onLogout={signOut} />;
  }
}
