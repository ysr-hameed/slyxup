import { useState, useEffect } from "react";
import { createSlyxupClient } from "@slyxup/sdk";
import { Layout } from "../components/Layout";
import { BILLING_BASE, API_BASE } from "../config";

interface Plan {
  id: string; name: string; description: string | null;
  amount: number; currency: string; interval: string;
}

interface Subscription {
  id: string; user_id: string; plan_id: string; status: string; current_period_end: string | null;
}

export function Billing({ jwt, user, onLogout }: { jwt: string; user: { id?: string; name?: string | null; email: string } | null; onLogout: () => void }) {
  const api = createSlyxupClient({
    authBaseUrl: import.meta.env.DEV ? "http://localhost:8000" : "https://auth.slyxup.online",
    billingBaseUrl: BILLING_BASE,
    analyticsBaseUrl: import.meta.env.DEV ? "http://localhost:8003" : "https://analytics.slyxup.online",
  });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [usage, setUsage] = useState<{ total: number; limit: number }>({ total: 0, limit: 10 });

  useEffect(() => {
    Promise.all([
      api.billing.listPlans("url-shortener").catch(() => [] as Plan[]),
      user?.id ? api.billing.getSubscription(user.id).catch(() => null) : Promise.resolve(null),
      fetch(`${API_BASE}/api/url?limit=1`).then(r => r.json()).then(d => {
        const total = d?.data?.length > 0 ? 100 : 0;
        return { total, limit: 10 };
      }).catch(() => ({ total: 0, limit: 10 })),
    ]).then(([plans, sub]) => {
      setPlans(plans);
      setSubscription(sub);
    }).finally(() => setLoading(false));
  }, []);

  const subscribe = async (planId: string) => {
    setActionLoading(planId);
    setToast(null);
    try {
      const { url } = await api.billing.createCheckout({
        plan_id: planId,
        user_id: user?.id || "",
        platform: "url-shortener",
        success_url: `${window.location.origin}/billing?success=true`,
        cancel_url: `${window.location.origin}/billing?canceled=true`,
      });
      window.location.href = url;
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "Failed to create checkout" });
    } finally {
      setActionLoading(null);
    }
  };

  const manageBilling = async () => {
    setActionLoading("portal");
    setToast(null);
    try {
      const { url } = await api.billing.createPortal({
        user_id: user?.id || "",
        platform: "url-shortener",
      });
      window.location.href = url;
    } catch (err: any) {
      setToast({ type: "error", message: err.message || "No active subscription" });
    } finally {
      setActionLoading(null);
    }
  };

  const isPro = subscription?.status === "active" || subscription?.status === "trialing";

  const planFeatures = [
    { key: "urls", free: "10 URLs", pro: "1,000 URLs" },
    { key: "slugs", free: "6-char auto slugs", pro: "Custom slugs" },
    { key: "expiry", free: "30-day expiry", pro: "No expiry" },
    { key: "support", free: "Standard support", pro: "Priority support" },
  ];

  return (
    <Layout user={user} onLogout={onLogout}>
      {toast && (
        <div className={`p-3 rounded-lg text-sm ${
          toast.type === "success"
            ? "bg-green-900/50 border border-green-700 text-green-300"
            : "bg-red-900/50 border border-red-700 text-red-300"
        }`}>
          {toast.message}
        </div>
      )}

      <div>
        <h2 className="text-zinc-100 font-semibold mb-4">Billing & Plans</h2>

        {subscription && (
          <div className="p-4 bg-zinc-900 rounded-xl mb-6 border border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wide font-medium">Current Plan</p>
                <p className="text-zinc-100 text-xl font-bold mt-0.5">{isPro ? "Pro" : "Free"}</p>
                <p className="text-zinc-500 text-xs mt-0.5 capitalize">
                  {subscription.status}
                  {subscription.current_period_end && !isPro && (
                    ` · Expired ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  )}
                  {subscription.current_period_end && isPro && (
                    ` · Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  )}
                </p>
              </div>
              {isPro && (
                <button
                  onClick={manageBilling}
                  disabled={actionLoading === "portal"}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === "portal" ? "Loading..." : "Manage Subscription"}
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 animate-pulse">
                <div className="h-5 bg-zinc-800 rounded w-24 mb-3" />
                <div className="h-8 bg-zinc-800 rounded w-20 mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-zinc-800 rounded w-40" />
                  <div className="h-3 bg-zinc-800 rounded w-32" />
                  <div className="h-3 bg-zinc-800 rounded w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            <div className={`p-4 bg-zinc-900 rounded-xl border ${!isPro ? "border-blue-700/50" : "border-zinc-800"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-zinc-100 font-semibold text-lg">Free</h3>
                {!isPro && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400 font-medium uppercase tracking-wide">Current</span>
                )}
              </div>
              <p className="text-2xl font-bold text-zinc-100">$0</p>
              <p className="text-zinc-500 text-sm">Forever free, no credit card</p>
              <ul className="text-sm text-zinc-400 mt-4 space-y-2">
                {planFeatures.map(f => (
                  <li key={f.key} className="flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f.free}
                  </li>
                ))}
              </ul>
              {!isPro && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1">
                    <span>Usage</span>
                    <span>0 / 10 URLs</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: "0%" }} />
                  </div>
                </div>
              )}
            </div>

            {plans.map(plan => (
              <div key={plan.id} className={`p-4 bg-zinc-900 rounded-xl border ${
                isPro && subscription?.plan_id === plan.id ? "border-amber-700/50" : "border-zinc-800"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-zinc-100 font-semibold text-lg">{plan.name}</h3>
                  {isPro && subscription?.plan_id === plan.id && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/50 text-amber-400 font-medium uppercase tracking-wide">Active</span>
                  )}
                </div>
                <p className="text-2xl font-bold text-zinc-100">
                  ${(plan.amount / 100).toFixed(2)}
                  <span className="text-sm font-normal text-zinc-500">/{plan.interval}</span>
                </p>
                {plan.description && <p className="text-zinc-400 text-sm mt-1">{plan.description}</p>}
                <ul className="text-sm text-zinc-400 mt-4 space-y-2">
                  {planFeatures.map(f => (
                    <li key={f.key} className="flex items-center gap-2">
                      <svg className="w-4 h-4 shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f.pro}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => subscribe(plan.id)}
                  disabled={actionLoading === plan.id || (isPro && subscription?.plan_id === plan.id)}
                  className={`mt-4 w-full p-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPro && subscription?.plan_id === plan.id
                      ? "bg-zinc-800 text-zinc-500 cursor-default"
                      : "bg-amber-600 text-white hover:bg-amber-700"
                  }`}
                >
                  {actionLoading === plan.id ? "Redirecting..." : isPro && subscription?.plan_id === plan.id ? "Current Plan" : "Upgrade"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
