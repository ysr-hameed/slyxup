export interface EmailClientConfig {
  baseUrl: string;
  apiKey?: string;
}

export interface SendEmailRequest {
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  data?: Record<string, unknown>;
}

export interface EmailClient {
  send(data: SendEmailRequest): Promise<{ id: string }>;
}

export function createEmailClient(config: EmailClientConfig): EmailClient {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.apiKey ? { "X-API-Key": config.apiKey } : {}),
  };

  return {
    async send(data) {
      const res = await fetch(`${config.baseUrl}/api/email/send`, {
        method: "POST", headers, body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  };
}
