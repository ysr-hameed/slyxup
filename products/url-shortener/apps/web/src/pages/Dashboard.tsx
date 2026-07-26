import { useState, useEffect, useCallback } from "react";
import { Layout, API_BASE } from "../components/Layout";

interface UrlEntry {
  id: string; slug: string; originalUrl: string; clicks: number; createdAt: string;
  title?: string; isCustom: number; isActive: number; expiresAt?: string;
}

export function Dashboard({ jwt, user, onLogout }: { jwt: string; user: { name?: string; email: string } | null; onLogout: () => void }) {
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [plan, setPlan] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const fetchUrls = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/url`, { headers: { Authorization: `Bearer ${jwt}` } });
      const json = await res.json();
      if (json.success) setUrls(json.data);
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => { fetchUrls(); }, [fetchUrls]);

  const createUrl = async () => {
    setError("");
    setShortUrl("");
    setCreating(true);
    try {
      const body: Record<string, string> = { url: newUrl };
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
        setNewUrl("");
        setSlug("");
        setTitle("");
        setRefresh(r => r + 1);
      } else {
        setError(json.error);
      }
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const removeUrl = async (id: string) => {
    if (!confirm("Delete this link?")) return;
    setDeleting(id);
    await fetch(`${API_BASE}/api/url/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${jwt}` },
    });
    setDeleting(null);
    setRefresh(r => r + 1);
  };

  const getPlanBadge = () => {
    const isPro = plan === "pro" || urls.some(u => u.isCustom);
    return isPro
      ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-400 font-medium">Pro</span>
      : <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">Free</span>;
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-4 bg-zinc-900 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-zinc-100 font-semibold">Create Short Link</h2>
          {getPlanBadge()}
        </div>

        <input
          className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          placeholder="https://example.com/very/long/url"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && createUrl()}
        />

        <input
          className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          placeholder="Title (optional)"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input type="checkbox" checked={showCustom} onChange={e => setShowCustom(e.target.checked)} />
          Custom slug <span className="text-zinc-500">(Pro)</span>
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
          onClick={createUrl}
          disabled={creating || !newUrl}
        >
          {creating ? "Shortening..." : "Shorten"}
        </button>

        {shortUrl && (
          <div className="p-3 rounded bg-green-900/30 border border-green-700/50 text-sm space-y-1">
            <p className="text-green-300 break-all">
              <a href={shortUrl} className="underline" target="_blank" rel="noreferrer">{shortUrl}</a>
            </p>
            {plan && <p className="text-zinc-500 text-xs">Plan: {plan}</p>}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-zinc-100 font-semibold mb-2">Your Links ({urls.length})</h2>

        {loading && <p className="text-zinc-500 text-sm text-center py-8">Loading URLs...</p>}

        {!loading && urls.length === 0 && (
          <p className="text-zinc-500 text-sm text-center py-8">No URLs yet. Create your first short link!</p>
        )}

        <div className="space-y-2">
          {urls.map(u => (
            <div key={u.id} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <a href={`${API_BASE}/${u.slug}`}
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
      </div>
    </Layout>
  );
}
