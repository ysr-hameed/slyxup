import { cn } from "./cn";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success";

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: BadgeVariant;
  children: React.ReactNode;
}) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
    secondary: "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]",
    destructive: "bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)]",
    outline: "border text-[var(--color-foreground)]",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-transparent px-2 py-0.5 text-xs font-semibold transition-colors",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
