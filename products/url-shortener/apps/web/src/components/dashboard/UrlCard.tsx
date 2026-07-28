import { ExternalLink, Copy, Check, Trash2, Eye, Clock } from "lucide-react";
import type { UrlEntry } from "../../lib/api";
import { formatRelativeTime, getShortDomain } from "../../lib/utils";
import { Badge } from "../ui/Badge";

interface UrlCardProps {
  url: UrlEntry;
  onCopy: (text: string) => void;
  onDelete: (id: string) => void;
  copied: string;
  deleting: string | null;
}

export function UrlCard({ url, onCopy, onDelete, copied, deleting }: UrlCardProps) {
  const shortUrl = `${getShortDomain()}/${url.slug}`;
  const isCopied = copied === shortUrl;

  return (
    <div className="group flex items-start justify-between p-4 bg-zinc-900/30 border border-zinc-800/30 rounded-xl hover:bg-zinc-900/50 hover:border-zinc-700/50 transition-all duration-200">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/${url.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-blue-400 font-medium text-sm hover:underline truncate"
          >
            /{url.slug}
          </a>
          {url.isCustom ? <Badge variant="pro">custom</Badge> : null}
          {isCopied && (
            <span className="text-[10px] text-green-400 animate-pulse flex items-center gap-1">
              <Check className="w-3 h-3" /> Copied!
            </span>
          )}
        </div>
        <p className="text-zinc-500 text-xs truncate max-w-lg">{url.originalUrl}</p>
        <div className="flex items-center gap-3 text-zinc-600 text-xs">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {url.clicks}
          </span>
          {url.expiresAt && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Expires {new Date(url.expiresAt).toLocaleDateString()}
            </span>
          )}
          <span>{formatRelativeTime(url.createdAt)}</span>
          {url.title && <span className="text-zinc-500 truncate max-w-24">{url.title}</span>}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-4">
        <button
          onClick={() => onCopy(shortUrl)}
          className="p-2 text-zinc-600 hover:text-zinc-300 rounded-lg hover:bg-zinc-800/50 transition-all duration-200 opacity-0 group-hover:opacity-100"
          title="Copy short URL"
        >
          <Copy className="w-4 h-4" />
        </button>
        <a
          href={url.originalUrl}
          target="_blank"
          rel="noreferrer"
          className="p-2 text-zinc-600 hover:text-zinc-300 rounded-lg hover:bg-zinc-800/50 transition-all duration-200 opacity-0 group-hover:opacity-100"
          title="Open original URL"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <button
          onClick={() => onDelete(url.id)}
          disabled={deleting === url.id}
          className="p-2 text-zinc-600 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-30"
          title="Delete URL"
        >
          {deleting === url.id ? (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
