import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useSearchParams } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import { auth } from "./lib/api";

const AUTH_WEB = import.meta.env.VITE_AUTH_WEB_URL || "http://localhost:5173";

function AppInner() {
  const navigate = useNavigate();
  const [jwt, setJwt] = useState<string | null>(() => localStorage.getItem("jwt"));

  useEffect(() => {
    if (jwt) {
      auth.me(jwt).then((res: any) => {
        if (!res.success) {
          localStorage.removeItem("jwt");
          setJwt(null);
        }
      });
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("jwt");
    setJwt(null);
    navigate("/");
  };

  const loginUrl = `${AUTH_WEB}/login?redirect=${encodeURIComponent(window.location.origin + "/callback")}&platform=url-shortener`;
  const registerUrl = `${AUTH_WEB}/register?redirect=${encodeURIComponent(window.location.origin + "/callback")}&platform=url-shortener`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg">Shrt</Link>
          <div className="flex items-center gap-3">
            {jwt ? (
              <>
                <Link to="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-100">Dashboard</Link>
                <button onClick={logout} className="text-sm text-zinc-500 hover:text-zinc-300">Logout</button>
              </>
            ) : (
              <>
                <a href={loginUrl} className="text-sm text-zinc-400 hover:text-zinc-100">Login</a>
                <a href={registerUrl} className="px-3 py-1.5 bg-zinc-100 text-zinc-900 rounded text-sm font-medium hover:bg-zinc-300">Register</a>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/callback" element={<Callback onAuth={(j) => { localStorage.setItem("jwt", j); setJwt(j); navigate("/dashboard"); }} />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

function Callback({ onAuth }: { onAuth: (jwt: string) => void }) {
  const [params] = useSearchParams();
  const jwtParam = params.get("jwt");

  useEffect(() => {
    if (jwtParam) {
      onAuth(jwtParam);
    }
  }, [jwtParam]);

  return (
    <div className="text-center py-20">
      <p className="text-zinc-400">{jwtParam ? "Authenticating..." : "No token received."}</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

function Landing() {
  const AUTH_WEB = import.meta.env.VITE_AUTH_WEB_URL || "http://localhost:5173";
  const loginUrl = `${AUTH_WEB}/login?redirect=${encodeURIComponent(window.location.origin + "/callback")}&platform=url-shortener`;
  const registerUrl = `${AUTH_WEB}/register?redirect=${encodeURIComponent(window.location.origin + "/callback")}&platform=url-shortener`;

  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold mb-4">Shorten URLs. Simplify Sharing.</h1>
      <p className="text-zinc-400 mb-8 max-w-md mx-auto">Create short, memorable links that redirect to your long URLs. Track clicks and manage all links in one place.</p>
      <a href={registerUrl} className="inline-flex px-6 py-3 bg-zinc-100 text-zinc-900 rounded-lg font-medium hover:bg-zinc-300">Get Started</a>
    </div>
  );
}
