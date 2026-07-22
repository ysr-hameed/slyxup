export interface BillingClientConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  interval: string;
}

export interface CheckoutRequest {
  plan_id: string;
  user_id: string;
  platform: string;
  success_url: string;
  cancel_url: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_end: string | null;
}

export interface BillingClient {
  listPlans(platform?: string): Promise<Plan[]>;
  createCheckout(data: CheckoutRequest): Promise<{ url: string }>;
  getSubscription(userId: string): Promise<Subscription>;
}

export function createBillingClient(config: BillingClientConfig): BillingClient {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.apiKey ? { "X-API-Key": config.apiKey } : {}),
  };

  return {
    async listPlans(platform) {
      const params = platform ? `?platform=${platform}` : "";
      const res = await fetch(`${config.baseUrl}/api/billing/plans${params}`, { headers });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Plan[];
    },

    async createCheckout(data) {
      const res = await fetch(`${config.baseUrl}/api/billing/create-checkout`, {
        method: "POST", headers, body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },

    async getSubscription(userId: string) {
      const res = await fetch(`${config.baseUrl}/api/billing/subscription?user_id=${userId}`, { headers });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Subscription;
    },
  };
}
