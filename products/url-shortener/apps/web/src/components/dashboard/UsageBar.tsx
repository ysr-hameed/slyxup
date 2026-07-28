import { Zap } from "lucide-react";
import { Badge } from "../ui/Badge";

interface UsageBarProps {
  used: number;
  limit: number;
  plan: "free" | "pro";
}

export function UsageBar({ used, limit, plan }: UsageBarProps) {
  const percent = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">Usage</span>
          <Badge variant={plan === "pro" ? "pro" : "default"}>{plan === "pro" ? "Pro" : "Free"}</Badge>
        </div>
        <span className="text-zinc-500">
          {used} / {limit} URLs
        </span>
      </div>
      <div className="h-2 bg-zinc-800/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-amber-500" : "bg-gradient-to-r from-blue-600 to-indigo-600"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {plan === "free" && percent >= 80 && (
        <a
          href="/billing"
          onClick={(e) => {
            e.preventDefault();
            window.history.pushState({}, "", "/billing");
            window.dispatchEvent(new Event("popstate"));
          }}
          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          <Zap className="w-3 h-3" />
          Upgrade to Pro for more URLs
        </a>
      )}
    </div>
  );
}
