export interface AnalyticsClientConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface TrackEventRequest {
  name: string;
  platform: string;
  user_id?: string;
  properties?: Record<string, unknown>;
}

export interface AnalyticsClient {
  trackEvent(data: TrackEventRequest): Promise<void>;
  trackPageView(data: { path: string; platform: string; user_id?: string; referrer?: string }): Promise<void>;
  getSummary(): Promise<{ totalPageViews: number }>;
}

export function createAnalyticsClient(config: AnalyticsClientConfig): AnalyticsClient {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.apiKey ? { "X-API-Key": config.apiKey } : {}),
  };

  return {
    async trackEvent(data) {
      const res = await fetch(`${config.baseUrl}/api/analytics/event`, {
        method: "POST", headers, body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },

    async trackPageView(data) {
      const res = await fetch(`${config.baseUrl}/api/analytics/pageview`, {
        method: "POST", headers, body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },

    async getSummary() {
      const res = await fetch(`${config.baseUrl}/api/analytics/summary`, { headers });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  };
}
