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
  const authHeaders: Record<string, string> = {
    ...(config.apiKey ? { "X-API-Key": config.apiKey } : {}),
  };

  async function post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${config.baseUrl}${path}`, {
      method: "POST", headers: { ...authHeaders, "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data as T;
  }

  async function get<T>(path: string): Promise<T> {
    const res = await fetch(`${config.baseUrl}${path}`, { headers: authHeaders });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data as T;
  }

  return {
    trackEvent: (data) => post("/api/analytics/event", data),
    trackPageView: (data) => post("/api/analytics/pageview", data),
    getSummary: () => get<{ totalPageViews: number }>("/api/analytics/summary"),
  };
}
