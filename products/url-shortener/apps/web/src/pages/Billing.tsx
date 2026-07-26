import { useState, useEffect } from "react";
import { createSlyxupClient } from "@slyxup/sdk";
import { Layout, AUTH_BASE } from "../components/Layout";

interface Plan {
  id: string; name: string; description: string | null;
  amount: number; currency: string; interval: string;
}

interface Subscription {
  id: string; plan_id: string; status: string; current_period_end: string | null;
}

export function Billing({ jwt, user, onLogout }: { jwt: string; user: { name?: string; email: string } | null; onLogout: () => void }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const api = createSlyxupClient({
      authBaseUrl: AUTH_BASE,
      billingBaseUrl: import.meta.env.DEV ? "http://localhost:8001" : "https://billing.slyxup.online",
      apiKey: "dev-key",
    });

    Promise.all([
      api.billing.listPlans("url-shortener").catch(() => [] as Plan[]),
      api.billing.getSubscription(user?.email || "").catch(() => null),
    ]).then(([plans, sub]) => {
      setPlans(plans);
      setSubscription(sub);
    }).finally(() => setLoading(false));
  }, []);

  const BILLING_BASE = import.meta.env.DEV ? "http://localhost:8001" : "https://billing.slyxup.online";

  const subscribe = async (planId: string) => {
    setError("");
    try {
      const res = await fetch(`${BILLING_BASE}/api/billing/create-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: planId, platform: "url-shortener", user_id: user?.email }),
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        window.location.href = json.data.url;
      } else {
        setError(json.error || "Failed to create checkout");
      }
    } catch {
      setError("Network error");
    }
  };

  const manageBilling = async () => {
    try {
      const res = await fetch(`${BILLING_BASE}/api/billing/create-portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "url-shortener", user_id: user?.email }),
      });
      const json = await res.json();
      if (json.success && json.data?.url) {
        window.location.href = json.data.url;
      } else {
        setError(json.error || "No active subscription");
      }
    } catch {
      setError("Network error");
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div>
        <h2 className="text-zinc-100 font-semibold mb-4">Billing & Plans</h2>

        {subscription && (
          <div className="p-4 bg-zinc-900 rounded-xl mb-6">
            <h3 className="text-zinc-300 font-medium text-sm">Current Plan</h3>
            <p className="text-zinc-100 text-lg font-semibold mt-1">
              {subscription.status === "active" || subscription.status === "trialing" ? "Pro" : "Free"}
            </p>
            <p className="text-zinc-500 text-xs mt-0.5">
              Status: {subscription.status}
              {subscription.current_period_end && ` · Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`}
            </p>
            {(subscription.status === "active" || subscription.status === "trialing") && (
              <button
                onClick={manageBilling}
                className="mt-3 px-4 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
              >
                Manage Subscription
              </button>
            )}
          </div>
        )}

        {loading ? (
          <p className="text-zinc-500 text-sm">Loading plans...</p>
        ) : (
          <div className="grid gap-4">
            <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-700">
              <h3 className="text-zinc-100 font-semibold">Free</h3>
              <p className="text-2xl font-bold text-zinc-100 mt-1">$0</p>
              <ul className="text-sm text-zinc-400 mt-3 space-y-1">
                <li>✓ 10 URLs max</li>
                <li>✓ 6-char random slugs</li>
                <li>✓ 30-day expiry</li>
                <li>✗ Custom slugs</li>
              </ul>
              {!subscription && (
                <p className="text-xs text-zinc-500 mt-3">Currently active</p>
              )}
            </div>

            {plans.map(plan => (
              <div key={plan.id} className="p-4 bg-zinc-900 rounded-xl border border-amber-800/50">
                <h3 className="text-zinc-100 font-semibold">{plan.name}</h3>
                <p className="text-2xl font-bold text-zinc-100 mt-1">
                  ${(plan.amount / 100).toFixed(2)}
                  <span className="text-sm font-normal text-zinc-500">/{plan.interval}</span>
                </p>
                {plan.description && <p className="text-sm text-zinc-400 mt-1">{plan.description}</p>}
                <ul className="text-sm text-zinc-400 mt-3 space-y-1">
                  <li>✓ 1,000 URLs max</li>
                  <li>✓ Custom slugs</li>
                  <li>✓ No expiry</li>
                  <li>✓ Priority support</li>
                </ul>
                <button
                  onClick={() => subscribe(plan.id)}
                  className="mt-4 w-full p-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-colors"
                >
                  {subscription?.plan_id === plan.id ? "Current Plan" : "Upgrade"}
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      </div>
    </Layout>
  );
}
