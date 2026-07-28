import { useState, useEffect } from "react";
import { CreditCard, Check, ExternalLink } from "lucide-react";
import { createSlyxupClient } from "@slyxup/sdk";
import { AppLayout } from "../components/layout/AppLayout";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../hooks/useToast";
import { BILLING_BASE, API_BASE } from "../config";
import type { User } from "../App";

interface Plan {
  id: string; name: string; description: string | null;
  amount: number; currency: string; interval: string;
}

interface BillingProps {
  jwt: string;
  user: User | null;
  onLogout: () => void;
}

const planFeatures = [
  { key: "urls", free: "10 URLs", pro: "1,000 URLs" },
  { key: "slugs", free: "6-char auto slugs", pro: "Custom slugs" },
  { key: "expiry", free: "30-day expiry", pro: "No expiry" },
  { key: "support", free: "Standard support", pro: "Priority support" },
];

export function Billing({ jwt, user, onLogout }: BillingProps) {
  const api = createSlyxupClient({
    authBaseUrl: import.meta.env.DEV ? "http://localhost:8000" : "https://auth.slyxup.online",
    billingBaseUrl: BILLING_BASE,
    jwt,
  });
  const { toast, showToast } = useToast();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.billing.listPlans("url-shortener").catch(() => [] as Plan[]),
      user?.id ? api.billing.getSubscription(user.id).catch(() => null) : Promise.resolve(null),
    ]).then(([plans, sub]) => {
      setPlans(plans);
      setSubscription(sub);
    }).finally(() => setLoading(false));
  }, []);

  const subscribe = async (planId: string) => {
    setActionLoading(planId);
    try {
      const { url } = await api.billing.createCheckout({
        plan_id: planId, user_id: user?.id || "", platform: "url-shortener",
        success_url: `${window.location.origin}/billing?success=true`,
        cancel_url: `${window.location.origin}/billing?canceled=true`,
      });
      window.location.href = url;
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to create checkout" });
    } finally {
      setActionLoading(null);
    }
  };

  const manageBilling = async () => {
    setActionLoading("portal");
    try {
      const { url } = await api.billing.createPortal({
        user_id: user?.id || "", platform: "url-shortener",
      });
      window.location.href = url;
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "No active subscription" });
    } finally {
      setActionLoading(null);
    }
  };

  const isPro = subscription?.status === "active" || subscription?.status === "trialing";

  return (
    <AppLayout user={user} onLogout={onLogout} toast={toast}>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-800/20 flex items-center justify-center">
            <CreditCard className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-zinc-100 font-semibold text-lg">Billing & Plans</h1>
            <p className="text-zinc-500 text-xs">Manage your subscription and billing</p>
          </div>
        </div>

        {subscription && (
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-wider font-medium">Current Plan</p>
                <p className="text-zinc-100 text-2xl font-bold mt-1">{isPro ? "Pro" : "Free"}</p>
                <p className="text-zinc-500 text-xs mt-1 capitalize">
                  {subscription.status}
                  {subscription.current_period_end && isPro &&
                    ` · Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`}
                </p>
              </div>
              {isPro && (
                <Button variant="secondary" onClick={manageBilling} loading={actionLoading === "portal"} className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Manage
                </Button>
              )}
            </div>
          </Card>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {[1, 2].map((i) => (
              <div key={i} className="p-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl space-y-4">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-40" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((j) => (
                    <Skeleton key={j} className="h-3 w-36" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            <Card className={`p-6 ${!isPro ? "border-blue-500/30" : ""}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-zinc-100 font-semibold text-lg">Free</h3>
                {!isPro && <Badge variant="success">Current</Badge>}
              </div>
              <p className="text-3xl font-extrabold text-zinc-100">$0</p>
              <p className="text-zinc-500 text-sm mt-1">Forever free, no credit card</p>
              <ul className="mt-6 space-y-3">
                {planFeatures.map((f) => (
                  <li key={f.key} className="flex items-center gap-3 text-sm text-zinc-300">
                    <div className="w-5 h-5 rounded-full bg-green-900/30 border border-green-700/30 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    {f.free}
                  </li>
                ))}
              </ul>
            </Card>

            {plans.map((plan) => {
              const isActive = isPro && subscription?.plan_id === plan.id;
              return (
                <Card key={plan.id} className={`p-6 ${isActive ? "border-blue-500/30" : ""}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-zinc-100 font-semibold text-lg">{plan.name}</h3>
                    {isActive && <Badge variant="pro">Active</Badge>}
                    {!isActive && isPro && <Badge>Inactive</Badge>}
                  </div>
                  <p className="text-3xl font-extrabold text-zinc-100">
                    ${(plan.amount / 100).toFixed(2)}
                    <span className="text-sm font-normal text-zinc-500">/{plan.interval}</span>
                  </p>
                  {plan.description && <p className="text-zinc-400 text-sm mt-1">{plan.description}</p>}
                  <ul className="mt-6 space-y-3">
                    {planFeatures.map((f) => (
                      <li key={f.key} className="flex items-center gap-3 text-sm text-zinc-300">
                        <div className="w-5 h-5 rounded-full bg-green-900/30 border border-green-700/30 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-green-400" />
                        </div>
                        {f.pro}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={isActive ? "secondary" : "primary"}
                    onClick={() => subscribe(plan.id)}
                    loading={actionLoading === plan.id}
                    disabled={isActive}
                    className="w-full mt-6"
                  >
                    {isActive ? "Current Plan" : "Upgrade"}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
