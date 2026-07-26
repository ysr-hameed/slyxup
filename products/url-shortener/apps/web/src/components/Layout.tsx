import type { ReactNode } from "react";
import { AUTH_BASE, API_BASE } from "../config";

export { AUTH_BASE, API_BASE };

export function Layout({ children, user, onLogout }: { children: ReactNode; user?: { id?: string; name?: string; email: string } | null; onLogout?: () => void }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-xl font-bold text-zinc-100 hover:text-zinc-300 transition-colors">
              URL Shortener
            </a>
            {user && (
              <>
                <a href="/dashboard" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Links</a>
                <a href="/billing" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">Billing</a>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <>
                <a href="/settings" className="text-zinc-400 text-sm truncate max-w-40 hover:text-zinc-200 transition-colors">
                  {user.name || user.email}
                </a>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
                  >
                    Logout
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {children}
      </main>
    </div>
  );
}
