export interface NotificationClientConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface SendNotificationRequest {
  user_id: string;
  channel: "email" | "sms" | "push";
  to_address: string;
  subject?: string;
  body: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  channel: string;
  to_address: string;
  subject: string | null;
  status: string;
  error: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface NotificationClient {
  send(data: SendNotificationRequest): Promise<NotificationLog>;
  listLogs(): Promise<NotificationLog[]>;
}

export function createNotificationClient(config: NotificationClientConfig): NotificationClient {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.apiKey ? { "X-API-Key": config.apiKey } : {}),
  };

  async function request<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${config.baseUrl}/api/notification${path}`, {
      method: body ? "POST" : "GET",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json: any = await res.json();
    if (!json.success) throw new Error(json.error);
    return json.data as T;
  }

  return {
    send: (data) => request<NotificationLog>("/send", data),
    listLogs: () => request<NotificationLog[]>("/logs"),
  };
}
