import { Link, LogOut, Settings, CreditCard, Link2 } from "lucide-react";
import type { User } from "../../App";

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

function NavLink({ href, icon: Icon, children }: { href: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        window.history.pushState({}, "", href);
        window.dispatchEvent(new Event("popstate"));
      }}
      className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800/50 transition-all duration-200"
    >
      <Icon className="w-4 h-4" />
      {children}
    </a>
  );
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1">
            <a
              href="/dashboard"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, "", "/dashboard");
                window.dispatchEvent(new Event("popstate"));
              }}
              className="flex items-center gap-2.5 px-3 py-2"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-zinc-100">
                <span className="text-blue-400">Slyx</span>Up
              </span>
            </a>
            <nav className="hidden sm:flex items-center ml-2">
              <NavLink href="/dashboard" icon={Link2}>Links</NavLink>
              <NavLink href="/billing" icon={CreditCard}>Billing</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <>
                <a
                  href="/settings"
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState({}, "", "/settings");
                    window.dispatchEvent(new Event("popstate"));
                  }}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800/50 transition-all duration-200"
                >
                  <Settings className="w-4 h-4" />
                  <span className="truncate max-w-32">{user.name || user.email}</span>
                </a>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile bottom nav */}
        {user && (
          <div className="sm:hidden flex items-center gap-1 pb-3">
            <NavLink href="/dashboard" icon={Link2}>Links</NavLink>
            <NavLink href="/billing" icon={CreditCard}>Billing</NavLink>
            <NavLink href="/settings" icon={Settings}>Settings</NavLink>
          </div>
        )}
      </div>
    </header>
  );
}
