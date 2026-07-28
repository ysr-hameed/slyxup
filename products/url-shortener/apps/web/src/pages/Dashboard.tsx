import { useState, useEffect, useCallback } from "react";
import { createSlyxupClient } from "@slyxup/sdk";
import { AppLayout } from "../components/layout/AppLayout";
import { CreateUrlForm } from "../components/dashboard/CreateUrlForm";
import { UrlList } from "../components/dashboard/UrlList";
import { UsageBar } from "../components/dashboard/UsageBar";
import { createUrlClient, type UrlEntry } from "../lib/api";
import { useToast } from "../hooks/useToast";
import { useClipboard } from "../hooks/useClipboard";
import { BILLING_BASE } from "../config";
import type { User } from "../App";

interface DashboardProps {
  jwt: string;
  user: User | null;
  onLogout: () => void;
}

export function Dashboard({ jwt, user, onLogout }: DashboardProps) {
  const api = createUrlClient(jwt);
  const sdk = createSlyxupClient({ billingBaseUrl: BILLING_BASE, jwt });
  const { toast, showToast } = useToast();
  const { copied, copy } = useClipboard();

  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [usage, setUsage] = useState({ used: 0, limit: 10, plan: "free" as "free" | "pro" });

  const fetchUrls = useCallback(async (append = false, pageCursor?: string) => {
    if (!append) setLoading(true);
    try {
      const data = await api.list(append ? pageCursor ?? cursor : undefined);
      if (append) {
        setUrls((prev) => [...prev, ...data.items]);
      } else {
        setUrls(data.items);
        setUsage((prev) => ({ ...prev, used: data.items.length }));
      }
      setHasMore(!!data.nextCursor);
      setCursor(data.nextCursor);
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [jwt]);

  useEffect(() => { fetchUrls(false); }, [fetchUrls]);

  useEffect(() => {
    if (user?.id) {
      sdk.billing.getSubscription(user.id).then((sub) => {
        const isPro = sub.status === "active" || sub.status === "trialing";
        setUsage((prev) => ({ ...prev, limit: isPro ? 1000 : 10, plan: isPro ? "pro" : "free" }));
      }).catch(() => {});
    }
  }, [user?.id]);

  const handleCreate = async (url: string, slug?: string, title?: string) => {
    const data = await api.create(url, slug, title);
    fetchUrls(false);
    showToast({ type: "success", message: "Short link created!" });
    return data;
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const prev = urls;
    setUrls((u) => u.filter((x) => x.id !== id));
    try {
      await api.remove(id);
      showToast({ type: "success", message: "Link deleted" });
      setUsage((u) => ({ ...u, used: Math.max(0, u.used - 1) }));
    } catch (err: any) {
      setUrls(prev);
      showToast({ type: "error", message: err.message });
    } finally {
      setDeleting(null);
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchUrls(true, cursor);
  };

  return (
    <AppLayout user={user} onLogout={onLogout} toast={toast}>
      <div className="space-y-8">
        <CreateUrlForm onCreate={handleCreate} plan={usage.plan} />
        <UsageBar used={usage.used} limit={usage.limit} plan={usage.plan} />
        <UrlList
          urls={urls}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          copied={copied}
          deleting={deleting}
          onCopy={(text) => copy(text)}
          onDelete={handleDelete}
          onLoadMore={handleLoadMore}
        />
      </div>
    </AppLayout>
  );
}
