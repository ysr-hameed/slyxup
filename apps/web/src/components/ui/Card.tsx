import type { ReactNode } from "react";

interface Props {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function Card({ title, subtitle, children, className = "", actions }: Props) {
  return (
    <div className={`bg-zinc-900 rounded-lg border border-zinc-800 ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            {title && <h3 className="font-semibold text-zinc-100">{title}</h3>}
            {subtitle && <p className="text-zinc-500 text-xs mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
