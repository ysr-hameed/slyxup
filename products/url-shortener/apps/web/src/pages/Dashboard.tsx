import { useState, useEffect, useCallback } from "react";
import { Layout } from "../components/Layout";
import { createUrlClient, type UrlEntry, type CreateUrlResult } from "../lib/api";
import { API_BASE } from "../config";

export function Dashboard({ jwt, user, onLogout }: { jwt: string; user: { name?: string | null; email: string } | null; onLogout: () => void }) {
  const api = createUrlClient(jwt);

  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<CreateUrlResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchUrls = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await api.list();
      setUrls(data.items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => { fetchUrls(true); }, [fetchUrls]);

  const createUrl = async () => {
    setError("");
    setResult(null);
    setCreating(true);
    try {
      const data = await api.create(newUrl, showCustom ? slug : undefined, title || undefined);
      setResult(data);
      setNewUrl("");
      setSlug("");
      setTitle("");
      setShowCustom(false);
      fetchUrls();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const removeUrl = async (id: string) => {
    if (!confirm("Delete this link?")) return;
    setDeleting(id);
    try {
      await api.remove(id);
      fetchUrls();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy");
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-4 bg-zinc-900 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-zinc-100 font-semibold">Create Short Link</h2>
        </div>

        <input
          className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          placeholder="https://example.com/very/long/url"
          value={newUrl}
          onChange={e => setNewUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !creating && createUrl()}
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

        {result && (
          <div className="p-3 rounded bg-green-900/30 border border-green-700/50 text-sm space-y-2">
            <div className="flex items-center justify-between gap-2">
              <a href={result.shortUrl} className="text-green-300 underline truncate" target="_blank" rel="noreferrer">
                {result.shortUrl}
              </a>
              <button
                onClick={() => copyToClipboard(result.shortUrl)}
                className="shrink-0 px-2.5 py-1 rounded bg-green-800 text-green-200 text-xs hover:bg-green-700 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-zinc-500 text-xs">
              {result.plan === "pro" ? "Pro" : "Free"} · {result.expiresAt ? `Expires ${new Date(result.expiresAt).toLocaleDateString()}` : "No expiry"}
            </p>
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
                  <span className="text-blue-400 text-sm font-medium truncate">/{u.slug}</span>
                    <button
                      onClick={() => copyToClipboard(`${API_BASE}/${u.slug}`)}
                      className="text-zinc-500 hover:text-zinc-300 shrink-0"
                      title="Copy short URL"
                    >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
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
