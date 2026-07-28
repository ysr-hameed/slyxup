import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export function OAuthCallback() {
  const [status, setStatus] = useState<"processing" | "done" | "error">("processing");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jwt = params.get("jwt");
    if (jwt) {
      sessionStorage.setItem("jwt", jwt);
      setStatus("done");
      setTimeout(() => {
        window.history.pushState({}, "", "/dashboard");
        window.dispatchEvent(new Event("popstate"));
      }, 500);
    } else {
      setStatus("error");
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        {status === "processing" && (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
            <p className="text-zinc-400 text-sm">Completing sign in...</p>
          </div>
        )}
        {status === "done" && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-green-900/30 border border-green-800/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-green-400" />
            </div>
            <p className="text-zinc-300 font-medium">Signed in!</p>
            <p className="text-zinc-500 text-xs">Redirecting to dashboard...</p>
          </div>
        )}
        {status === "error" && (
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-900/30 border border-red-800/30 flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7 text-red-400" />
            </div>
            <p className="text-zinc-300 font-medium">Sign in failed</p>
            <p className="text-zinc-500 text-sm">No authentication token received.</p>
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, "", "/login");
                window.dispatchEvent(new Event("popstate"));
              }}
              className="inline-block text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Back to login
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
