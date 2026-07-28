import { Check } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        window.history.pushState({}, "", href);
        window.dispatchEvent(new Event("popstate"));
      }}
    >
      {children}
    </a>
  );
}

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "Forever",
    description: "Perfect for getting started",
    features: ["10 URLs", "6-char auto slugs", "30-day expiry", "Standard support"],
    cta: "Start Free",
    variant: "secondary" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "For power users and teams",
    features: ["1,000 URLs", "Custom slugs", "No expiry", "Priority support"],
    cta: "Upgrade",
    variant: "primary" as const,
    popular: true,
  },
];

export function Pricing() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-100">Simple pricing</h2>
          <p className="text-zinc-400 mt-3 text-lg">Start free, upgrade when you need more.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative p-8 rounded-2xl border ${
                p.popular
                  ? "bg-gradient-to-b from-zinc-900 to-zinc-900/50 border-blue-500/30"
                  : "bg-zinc-900/50 border-zinc-800/50"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="pro">Popular</Badge>
                </div>
              )}
              <h3 className="text-zinc-100 font-semibold text-lg">{p.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-zinc-100">{p.price}</span>
                {p.period && <span className="text-zinc-500 text-sm">{p.period}</span>}
              </div>
              <p className="text-zinc-500 text-sm mt-1">{p.description}</p>
              <ul className="mt-6 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                    <div className="w-5 h-5 rounded-full bg-green-900/30 border border-green-700/30 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <NavLink href="/login">
                  <Button variant={p.variant} className="w-full">{p.cta}</Button>
                </NavLink>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
