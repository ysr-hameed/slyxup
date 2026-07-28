import type { ReactNode } from "react";
import { Link2 } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new Event("popstate"));
            }}
            className="inline-flex items-center gap-2.5"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-blue-400">Slyx</span>
              <span className="text-zinc-100">Up</span>
            </span>
          </a>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
          {subtitle && <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  );
}
