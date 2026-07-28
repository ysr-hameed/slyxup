export interface BillingClientConfig {
  baseUrl: string;
  apiKey?: string;
  jwt?: string;
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

export interface PortalRequest {
  user_id: string;
  platform: string;
}

export interface BillingClient {
  listPlans(platform?: string): Promise<Plan[]>;
  createCheckout(data: CheckoutRequest): Promise<{ url: string }>;
  createPortal(data: PortalRequest): Promise<{ url: string }>;
  getSubscription(userId: string): Promise<Subscription>;
}

export function createBillingClient(config: BillingClientConfig): BillingClient {
  const authHeaders: Record<string, string> = config.jwt
    ? { Authorization: `Bearer ${config.jwt}` }
    : { ...(config.apiKey ? { "X-API-Key": config.apiKey } : {}) };

  return {
    async listPlans(platform) {
      const params = platform ? `?platform=${platform}` : "";
      const res = await fetch(`${config.baseUrl}/api/billing/plans${params}`, { headers: authHeaders });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Plan[];
    },

    async createCheckout(data) {
      const res = await fetch(`${config.baseUrl}/api/billing/create-checkout`, {
        method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },

    async createPortal(data) {
      const res = await fetch(`${config.baseUrl}/api/billing/create-portal`, {
        method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify(data),
      });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },

    async getSubscription(userId: string) {
      const res = await fetch(`${config.baseUrl}/api/billing/subscription?user_id=${userId}`, { headers: authHeaders });
      const json: any = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as Subscription;
    },
  };
}
