import { Check, X } from "lucide-react";

const checks = [
  { label: "8+ characters", test: (p: string) => p.length >= 8 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /\d/.test(p) },
];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const score = checks.filter((c) => c.test(password)).length;
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-green-500"];
  const labels = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {checks.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score - 1] : "bg-zinc-800"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-500">{labels[score]}</p>
      <ul className="space-y-1">
        {checks.map((c, i) => (
          <li
            key={i}
            className={`flex items-center gap-1.5 text-xs ${
              c.test(password) ? "text-green-400" : "text-zinc-600"
            }`}
          >
            {c.test(password) ? (
              <Check className="w-3 h-3" />
            ) : (
              <X className="w-3 h-3" />
            )}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
