import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "./cn";

type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type Size = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const variantStyles: Record<Variant, string> = {
  default: "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow hover:opacity-90",
  destructive: "bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)] shadow-sm hover:opacity-90",
  outline: "border border-[var(--color-input)] bg-[var(--color-background)] shadow-sm hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]",
  secondary: "bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)] shadow-sm hover:opacity-80",
  ghost: "hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]",
  link: "text-[var(--color-primary)] underline-offset-4 hover:underline",
};

const sizeStyles: Record<Size, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-8",
  icon: "h-9 w-9",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
