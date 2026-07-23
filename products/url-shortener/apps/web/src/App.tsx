import { useState, useEffect, useCallback } from "react";
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({
  authBaseUrl: "http://localhost:8000",
  billingBaseUrl: "http://localhost:8001",
  emailBaseUrl: "http://localhost:8002",
  analyticsBaseUrl: "http://localhost:8003",
  storageBaseUrl: "http://localhost:8004",
});

type UrlEntry = { id: string; slug: string; originalUrl: string; clicks: number; createdAt: string };
type Page = "signin" | "signup";

function AuthPage({ onLogin }: { onLogin: (jwt: string) => void }) {
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
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 bg-zinc-900 rounded-xl space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-100">URL Shortener</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {page === "signin" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-900/50 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        {page === "signup" && (
          <input
            className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
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

        <p className="text-center text-zinc-400 text-sm">
          {page === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="text-blue-400 hover:text-blue-300 underline"
            onClick={() => { setPage(page === "signin" ? "signup" : "signin"); setError(""); }}
          >
            {page === "signin" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </form>
    </div>
  );
}

function UrlDashboard({ jwt, onLogout }: { jwt: string; onLogout: () => void }) {
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [user, setUser] = useState<{ name?: string; email: string } | null>(null);

  useEffect(() => {
    api.auth.me(jwt).then(u => setUser(u)).catch(() => {});
  }, [jwt]);

  const fetchUrls = useCallback(async () => {
    const res = await fetch("http://localhost:9000/api/url", { headers: { Authorization: `Bearer ${jwt}` } });
    const json = await res.json();
    if (json.success) setUrls(json.data);
  }, [jwt]);

  useEffect(() => { fetchUrls(); }, [fetchUrls]);

  const createUrl = async () => {
    setError("");
    setShortUrl("");
    const res = await fetch("http://localhost:9000/api/url", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ url: newUrl }),
    });
    const json = await res.json();
    if (json.success) {
      setShortUrl(json.data.shortUrl);
      setNewUrl("");
      fetchUrls();
    } else {
      setError(json.error);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-100">URL Shortener</h1>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-sm truncate max-w-40">
              {user?.name || user?.email || "Loading..."}
            </span>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="p-4 bg-zinc-900 rounded-xl space-y-3">
          <h2 className="text-zinc-100 font-semibold">Create Short Link</h2>
          <div className="flex gap-2">
            <input
              className="flex-1 p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              placeholder="https://example.com/very/long/url"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createUrl()}
            />
            <button
              className="px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
              onClick={createUrl}
            >
              Shorten
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {shortUrl && (
            <p className="text-green-400 text-sm break-all">
              Short URL: <a href={shortUrl} className="underline" target="_blank" rel="noreferrer">{shortUrl}</a>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-zinc-100 font-semibold">Your Links</h2>
          {urls.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
              <div className="flex-1 min-w-0">
                <a
                  href={`http://localhost:9000/${u.slug}`}
                  className="text-blue-400 underline text-sm hover:text-blue-300"
                  target="_blank"
                  rel="noreferrer"
                >
                  /{u.slug}
                </a>
                <p className="text-zinc-400 text-xs truncate mt-0.5">{u.originalUrl}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{u.clicks} clicks</p>
              </div>
              <button
                className="text-red-400 hover:text-red-300 text-sm ml-4 transition-colors"
                onClick={() => {
                  fetch(`http://localhost:9000/api/url/${u.id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${jwt}` },
                  }).then(fetchUrls);
                }}
              >
                Delete
              </button>
            </div>
          ))}
          {urls.length === 0 && (
            <p className="text-zinc-500 text-sm text-center py-8">No URLs yet. Create your first short link!</p>
          )}
        </div>
      </main>
    </div>
  );
}

export function App() {
  const [jwt, setJwt] = useState<string | null>(() => sessionStorage.getItem("jwt"));

  const handleLogin = (token: string) => {
    sessionStorage.setItem("jwt", token);
    setJwt(token);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("jwt");
    setJwt(null);
  };

  return jwt ? <UrlDashboard jwt={jwt} onLogout={handleLogout} /> : <AuthPage onLogin={handleLogin} />;
}
