import type { ReactNode } from "react";

interface Props {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  children: ReactNode;
}

const v = {
  default: "bg-zinc-700 text-zinc-300",
  success: "bg-green-900/40 text-green-300",
  warning: "bg-yellow-900/40 text-yellow-300",
  danger: "bg-red-900/40 text-red-300",
  info: "bg-blue-900/40 text-blue-300",
};

export function Badge({ variant = "default", children }: Props) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${v[variant]}`}>
      {children}
    </span>
  );
}
