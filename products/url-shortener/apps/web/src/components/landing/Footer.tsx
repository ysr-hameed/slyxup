import { Link2 } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-800/50 bg-zinc-900/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Link2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-zinc-400">
              <span className="text-blue-400">Slyx</span>Up
            </span>
          </div>
          <p className="text-zinc-600 text-xs">
            Built on Cloudflare Workers · SlyxUp URL Shortener
          </p>
        </div>
      </div>
    </footer>
  );
}
