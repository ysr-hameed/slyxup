import type { ReactNode } from "react";

type BadgeVariant = "default" | "pro" | "success" | "warning" | "danger";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const styles: Record<BadgeVariant, string> = {
  default: "bg-zinc-800 text-zinc-400",
  pro: "bg-amber-900/30 text-amber-400 border border-amber-700/30",
  success: "bg-green-900/30 text-green-400 border border-green-700/30",
  warning: "bg-yellow-900/30 text-yellow-400 border border-yellow-700/30",
  danger: "bg-red-900/30 text-red-400 border border-red-700/30",
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${styles[variant]}`}>
      {children}
    </span>
  );
}
