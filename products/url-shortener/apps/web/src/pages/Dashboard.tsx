import { useState, useEffect, useCallback } from "react";
import { createSlyxupClient } from "@slyxup/sdk";
import { Layout } from "../components/Layout";
import { createUrlClient, type UrlEntry, type CreateUrlResult } from "../lib/api";
import { API_BASE, BILLING_BASE } from "../config";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-zinc-800 rounded animate-pulse ${className}`} />;
}

type Toast = { type: "success" | "error"; message: string };

export function Dashboard({ jwt, user, onLogout }: { jwt: string; user: { id?: string; name?: string | null; email: string } | null; onLogout: () => void }) {
  const api = createUrlClient(jwt);
  const sdk = createSlyxupClient({ billingBaseUrl: BILLING_BASE });

  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);

  const [newUrl, setNewUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [createError, setCreateError] = useState("");
  const [result, setResult] = useState<CreateUrlResult | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [copied, setCopied] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [usage, setUsage] = useState<{ used: number; limit: number; plan: "free" | "pro" }>({ used: 0, limit: 10, plan: "free" });

  const showToast = (t: Toast) => {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUrls = useCallback(async (append = false) => {
    if (!append) setLoading(true);
    try {
      const data = await api.list(append ? cursor : undefined);
      if (append) {
        setUrls(prev => [...prev, ...data.items]);
      } else {
        setUrls(data.items);
      }
      setHasMore(!!data.nextCursor);
      setCursor(data.nextCursor);
      setUsage(prev => ({ ...prev, used: append ? urls.length + data.items.length : data.items.length }));
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [jwt, cursor]);

  useEffect(() => { fetchUrls(false); }, [fetchUrls]);

  useEffect(() => {
    if (user?.id) {
      sdk.billing.getSubscription(user.id).then(sub => {
        const isPro = sub.status === "active" || sub.status === "trialing";
        setUsage(prev => ({ ...prev, limit: isPro ? 1000 : 10, plan: isPro ? "pro" : "free" }));
      }).catch(() => {});
    }
  }, [user?.id]);

  const loadMore = async () => {
    setLoadingMore(true);
    await fetchUrls(true);
  };

  const createUrl = async () => {
    setCreateError("");
    setResult(null);
    setCreating(true);
    try {
      const data = await api.create(newUrl, showCustom ? slug : undefined, title || undefined);
      setResult(data);
      setNewUrl("");
      setSlug("");
      setTitle("");
      setShowCustom(false);
      fetchUrls(false);
      showToast({ type: "success", message: "Short link created!" });
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const removeUrl = async (id: string) => {
    setDeleting(id);
    const prev = urls;
    setUrls(u => u.filter(x => x.id !== id));
    try {
      await api.remove(id);
      showToast({ type: "success", message: "Link deleted" });
      setUsage(u => ({ ...u, used: Math.max(0, u.used - 1) }));
    } catch (err: any) {
      setUrls(prev);
      showToast({ type: "error", message: err.message });
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      showToast({ type: "error", message: "Failed to copy" });
    }
  };

  const usagePercent = Math.min(100, Math.round((usage.used / usage.limit) * 100));

  return (
    <Layout user={user} onLogout={onLogout}>
      {toast && (
        <div className={`p-3 rounded-lg text-sm ${
          toast.type === "success"
            ? "bg-green-900/50 border border-green-700 text-green-300"
            : "bg-red-900/50 border border-red-700 text-red-300"
        }`}>
          {toast.message}
        </div>
      )}

      {loading && (
        <div className="p-4 bg-zinc-900 rounded-xl space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}

      {!loading && (
        <div className="p-4 bg-zinc-900 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-zinc-100 font-semibold">Create Short Link</h2>
            <a href="/billing" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              {usage.used}/{usage.limit} used
            </a>
          </div>

          {/* Usage bar for free plan */}
          {usage.plan === "free" && (
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-amber-500" : "bg-blue-600"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}

          <input
            className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="https://example.com/very/long/url"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !creating && createUrl()}
            autoFocus
          />

          <input
            className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer select-none">
            <input type="checkbox" checked={showCustom} onChange={e => setShowCustom(e.target.checked)} className="rounded border-zinc-600" />
            Custom slug <span className="text-zinc-600">(Pro)</span>
          </label>

          {showCustom && (
            <input
              className="w-full p-2.5 rounded-lg bg-zinc-800 text-zinc-100 border border-zinc-700 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="my-custom-slug (4-12 chars, a-z0-9)"
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
              maxLength={12}
            />
          )}

          {createError && <p className="text-red-400 text-sm">{createError}</p>}

          <button
            className="w-full p-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={createUrl}
            disabled={creating || !newUrl}
          >
            {creating ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Shortening...
              </span>
            ) : "Shorten"}
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
                  {copied === result.shortUrl ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-zinc-500 text-xs">
                {result.plan === "pro" ? "Pro" : "Free"} · {result.expiresAt ? `Expires ${new Date(result.expiresAt).toLocaleDateString()}` : "No expiry"}
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-zinc-100 font-semibold">Your Links</h2>
          {!loading && urls.length > 0 && (
            <span className="text-xs text-zinc-500">{urls.length} total</span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 bg-zinc-900 rounded-lg space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        ) : urls.length === 0 ? (
          <div className="text-center py-12 px-4">
            <svg className="w-12 h-12 mx-auto text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-zinc-400 font-medium">No links yet</p>
            <p className="text-zinc-600 text-sm mt-1">Create your first short link above to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {urls.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg group hover:bg-zinc-800/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 text-sm font-medium truncate">/{u.slug}</span>
                    <button
                      onClick={() => copyToClipboard(`${API_BASE}/${u.slug}`)}
                      className="text-zinc-600 hover:text-zinc-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy short URL"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    {u.isCustom ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-400 font-medium">custom</span>
                    ) : null}
                    {copied === `${API_BASE}/${u.slug}` && (
                      <span className="text-[10px] text-green-400 animate-pulse">Copied!</span>
                    )}
                  </div>
                  <p className="text-zinc-400 text-xs truncate mt-0.5">{u.originalUrl}</p>
                  <div className="flex items-center gap-3 text-zinc-600 text-xs mt-0.5">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {u.clicks}
                    </span>
                    {u.expiresAt && (
                      <span>Expires {new Date(u.expiresAt).toLocaleDateString()}</span>
                    )}
                    {u.title && <span className="text-zinc-500">{u.title}</span>}
                  </div>
                </div>
                <button
                  className="text-red-500/60 hover:text-red-400 text-sm ml-4 transition-colors disabled:opacity-30"
                  onClick={() => removeUrl(u.id)}
                  disabled={deleting === u.id}
                >
                  {deleting === u.id ? (
                    <span className="animate-spin inline-block h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="text-center mt-4">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-6 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              {loadingMore ? (
                <span className="inline-flex items-center gap-2">
                  <span className="animate-spin h-3 w-3 border-2 border-zinc-400 border-t-transparent rounded-full" />
                  Loading...
                </span>
              ) : "Load More"}
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
