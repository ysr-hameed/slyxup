import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

const plans = [
  { name: "Free", price: "$0", desc: "Basic features for getting started", features: ["1 project", "Basic support", "Community access"] },
  { name: "Pro", price: "$19", desc: "Advanced features for professionals", features: ["Unlimited projects", "Priority support", "API access", "Analytics"], popular: true },
  { name: "Enterprise", price: "$99", desc: "Full power for large teams", features: ["Everything in Pro", "Custom integrations", "SLA", "Dedicated support"] },
];

export default function Pricing() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-zinc-100">Pricing</h1>
        <p className="text-zinc-400 mt-2">Choose the plan that fits your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className={`relative rounded-lg border p-6 ${
            plan.popular ? "border-blue-500 bg-zinc-900/80" : "border-zinc-800 bg-zinc-900"
          }`}>
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-blue-600 text-white text-xs rounded-full font-medium">
                Most Popular
              </span>
            )}
            <h3 className="text-lg font-semibold text-zinc-100">{plan.name}</h3>
            <div className="mt-3 mb-4">
              <span className="text-3xl font-bold text-zinc-100">{plan.price}</span>
              <span className="text-zinc-500 text-sm">/month</span>
            </div>
            <p className="text-zinc-400 text-sm mb-4">{plan.desc}</p>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="text-sm text-zinc-300 flex items-center gap-2">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              to={user ? "/dashboard" : "/register"}
              className={`block text-center py-2 rounded font-medium text-sm transition-colors ${
                plan.popular
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              }`}
            >
              {user ? "Get Started" : "Sign Up Free"}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
