import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";


export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-col items-center space-y-6">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-foreground)]">
              <span className="text-sm font-bold text-[var(--color-background)]">
                S
              </span>
            </div>
            <span className="text-xl font-bold tracking-tight">SlyxUp</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {subtitle}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
