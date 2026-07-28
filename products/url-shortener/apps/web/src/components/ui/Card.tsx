import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, hover, glow, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-zinc-900/50 border border-zinc-800/50 rounded-2xl ${hover ? "card-hover" : ""} ${glow ? "relative overflow-hidden" : ""} ${className}`}
      {...props}
    >
      {glow && (
        <div className="absolute inset-0 bg-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      )}
      {children}
    </div>
  );
}
