import { useState, useEffect, useCallback } from "react";
import { createSlyxupClient } from "@slyxup/sdk";

const API_BASE = "https://api-url.slyxup.online";

const api = createSlyxupClient({
  authBaseUrl: "https://auth.slyxup.online",
  billingBaseUrl: "https://billing.slyxup.online",
  analyticsBaseUrl: "https://analytics.slyxup.online",
});

interface UrlEntry {
  id: string; slug: string; originalUrl: string; clicks: number; createdAt: string;
  title?: string; isCustom: number; isActive: number; expiresAt?: string;
}

interface UserInfo { name?: string; email: string; }
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
          <div className="p-3 rounded bg-red-900/50 border border-red-700 text-red-300 text-sm">{error}</div>
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

function CreateUrlForm({ jwt, onCreated }: { jwt: string; onCreated: () => void }) {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setShortUrl("");
    setLoading(true);
    try {
      const body: Record<string, string> = { url };
      if (showCustom && slug) body.slug = slug;
      if (title) body.title = title;

      const res = await fetch(`${API_BASE}/api/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setShortUrl(json.data.shortUrl);
        setPlan(json.data.plan);
        setUrl("");
        setSlug("");
        setTitle("");
        onCreated();
      } else {
        setError(json.error);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-zinc-900 rounded-xl space-y-3">
      <h2 className="text-zinc-100 font-semibold">Create Short Link</h2>

      <input
        className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
        placeholder="https://example.com/very/long/url"
        value={url}
        onChange={e => setUrl(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSubmit()}
      />

      <input
        className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
        placeholder="Title (optional)"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
        <input type="checkbox" checked={showCustom} onChange={e => setShowCustom(e.target.checked)} />
        Custom slug (Pro feature)
      </label>

      {showCustom && (
        <input
          className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          placeholder="my-custom-slug (4-12 chars, a-z0-9)"
          value={slug}
          onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
          maxLength={12}
        />
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        className="w-full p-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        onClick={handleSubmit}
        disabled={loading || !url}
      >
        {loading ? "Shortening..." : "Shorten"}
      </button>

      {shortUrl && (
        <div className="p-3 rounded bg-green-900/30 border border-green-700/50 text-sm space-y-1">
          <p className="text-green-300 break-all">
            Short URL: <a href={shortUrl} className="underline" target="_blank" rel="noreferrer">{shortUrl}</a>
          </p>
          <p className="text-zinc-400 text-xs">Plan: {plan === "pro" ? "Pro" : "Free"}</p>
        </div>
      )}
    </div>
  );
}

function UrlList({ jwt, refresh, onRefresh }: { jwt: string; refresh: number; onRefresh: () => void }) {
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/url`, { headers: { Authorization: `Bearer ${jwt}` } })
      .then(r => r.json())
      .then(json => { if (json.success) setUrls(json.data); })
      .finally(() => setLoading(false));
  }, [jwt, refresh]);

  const removeUrl = async (id: string) => {
    if (!confirm("Delete this link?")) return;
    setDeleting(id);
    await fetch(`${API_BASE}/api/url/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    });
    setDeleting(null);
    onRefresh();
  };

  if (loading) {
    return <p className="text-zinc-500 text-sm text-center py-8">Loading URLs...</p>;
  }

  if (urls.length === 0) {
    return <p className="text-zinc-500 text-sm text-center py-8">No URLs yet. Create your first short link!</p>;
  }

  return (
    <div className="space-y-2">
      {urls.map(u => (
        <div key={u.id} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <a
                href={`${API_BASE}/${u.slug}`}
                className="text-blue-400 underline text-sm hover:text-blue-300"
                target="_blank" rel="noreferrer"
              >
                /{u.slug}
              </a>
              {u.isCustom ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-400 font-medium">custom</span>
              ) : null}
            </div>
            <p className="text-zinc-400 text-xs truncate mt-0.5">{u.originalUrl}</p>
            <div className="flex items-center gap-3 text-zinc-500 text-xs mt-0.5">
              <span>{u.clicks} clicks</span>
              {u.expiresAt && <span>Expires {new Date(u.expiresAt).toLocaleDateString()}</span>}
              {u.title && <span className="text-zinc-400">{u.title}</span>}
            </div>
          </div>
          <button
            className="text-red-400 hover:text-red-300 text-sm ml-4 transition-colors disabled:opacity-50"
            onClick={() => removeUrl(u.id)}
            disabled={deleting === u.id}
          >
            {deleting === u.id ? "..." : "Delete"}
          </button>
        </div>
      ))}
    </div>
  );
}

export function App() {
  const [jwt, setJwt] = useState<string | null>(() => sessionStorage.getItem("jwt"));
  const [refresh, setRefresh] = useState(0);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (jwt) {
      api.auth.me(jwt).then(setUser).catch(() => handleLogout());
    }
  }, [jwt]);

  const handleLogin = (token: string) => {
    sessionStorage.setItem("jwt", token);
    setJwt(token);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("jwt");
    setJwt(null);
    setUser(null);
  };

  if (!jwt) return <AuthPage onLogin={handleLogin} />;

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
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <CreateUrlForm jwt={jwt} onCreated={() => setRefresh(r => r + 1)} />
        <div>
          <h2 className="text-zinc-100 font-semibold mb-2">Your Links</h2>
          <UrlList jwt={jwt} refresh={refresh} onRefresh={() => setRefresh(r => r + 1)} />
        </div>
      </main>
    </div>
  );
}
