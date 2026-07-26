import { useState } from "react";
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({
  authBaseUrl: import.meta.env.DEV ? "http://localhost:8000" : "https://auth.slyxup.online",
});

type Page = "signin" | "signup";

export function AuthPage({ onLogin, onRegistered }: { onLogin: (jwt: string) => void; onRegistered: (email: string) => void }) {
  const [page, setPage] = useState<Page>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (page === "signup") {
        await api.auth.register({ email, password, name, platform: "url-shortener" });
        onRegistered(email);
        return;
      }
      const result = await api.auth.login({ email, password, platform: "url-shortener" });
      onLogin(result.jwt);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-100">URL Shortener</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {page === "signin" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 bg-zinc-900 rounded-xl space-y-4">
          {error && (
            <div className="p-3 rounded bg-red-900/50 border border-red-700 text-red-300 text-sm">{error}</div>
          )}

          {page === "signup" && (
            <input
              className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          )}

          <input
            className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />

          <button
            className="w-full p-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            type="submit"
            disabled={loading}
          >
            {loading ? "Please wait..." : page === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-zinc-400 text-sm">
            {page === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-blue-400 hover:text-blue-300 underline"
              onClick={() => { setPage(page === "signin" ? "signup" : "signin"); setError(""); }}
            >
              {page === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </p>
          {page === "signin" && (
            <p className="text-sm">
              <a href="/forgot-password" className="text-zinc-500 hover:text-zinc-300 underline">Forgot password?</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
