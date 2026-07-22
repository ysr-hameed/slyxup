import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: Props) {
  return (
    <div className="space-y-1">
      {label && <label className="text-zinc-400 text-xs block">{label}</label>}
      <input
        className={`w-full px-3 py-2 bg-zinc-900 border rounded text-zinc-100 placeholder-zinc-500 outline-none transition-colors ${
          error ? "border-red-600" : "border-zinc-700 focus:border-zinc-500"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
