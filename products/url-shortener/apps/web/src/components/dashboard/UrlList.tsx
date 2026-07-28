import { ChevronDown } from "lucide-react";
import { Button } from "../ui/Button";
import { Skeleton } from "../ui/Skeleton";
import { UrlCard } from "./UrlCard";
import { EmptyState } from "./EmptyState";
import type { UrlEntry } from "../../lib/api";

interface UrlListProps {
  urls: UrlEntry[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  copied: string;
  deleting: string | null;
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
  onLoadMore: () => void;
}

export function UrlList({ urls, loading, loadingMore, hasMore, copied, deleting, onCopy, onDelete, onLoadMore }: UrlListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-zinc-900/30 border border-zinc-800/30 rounded-xl space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-zinc-100 font-semibold">Your Links</h2>
        {urls.length > 0 && (
          <span className="text-xs text-zinc-500">{urls.length} total</span>
        )}
      </div>

      {urls.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {urls.map((u) => (
            <UrlCard
              key={u.id}
              url={u}
              onCopy={onCopy}
              onDelete={onDelete}
              copied={copied}
              deleting={deleting}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center mt-6">
          <Button variant="secondary" onClick={onLoadMore} loading={loadingMore} className="gap-2">
            <ChevronDown className="w-4 h-4" />
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
