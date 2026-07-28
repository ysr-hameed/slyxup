import type { ReactNode } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Header } from "./Header";
import type { Toast } from "../../hooks/useToast";
import type { User } from "../../App";

interface AppLayoutProps {
  children: ReactNode;
  user: User | null;
  onLogout: () => void;
  toast?: Toast | null;
}

export function AppLayout({ children, user, onLogout, toast }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Header user={user} onLogout={onLogout} />
      {toast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm ${
              toast.type === "success"
                ? "bg-green-900/80 border border-green-700/50 text-green-200 backdrop-blur-xl"
                : "bg-red-900/80 border border-red-700/50 text-red-200 backdrop-blur-xl"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            {toast.message}
          </div>
        </div>
      )}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
