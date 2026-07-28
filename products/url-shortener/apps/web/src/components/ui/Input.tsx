import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full px-3 py-2.5 rounded-xl bg-zinc-800/50 text-zinc-100 border border-zinc-700/50 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all duration-200 ${icon ? "pl-10" : ""} ${error ? "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10" : ""} ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400 pl-1">{error}</p>}
      </div>
    );
  }
);
