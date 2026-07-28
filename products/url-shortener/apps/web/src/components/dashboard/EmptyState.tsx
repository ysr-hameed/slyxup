import { Link2 } from "lucide-react";

export function EmptyState() {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mx-auto mb-4">
        <Link2 className="w-7 h-7 text-zinc-600" />
      </div>
      <h3 className="text-zinc-400 font-medium">No links yet</h3>
      <p className="text-zinc-600 text-sm mt-1 max-w-xs mx-auto">
        Create your first short link above to get started. Paste a URL and click "Shorten URL".
      </p>
    </div>
  );
}
