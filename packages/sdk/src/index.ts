import { createAuthClient, type AuthClient } from "@slyxup/auth-client";
import { createBillingClient, type BillingClient } from "@slyxup/billing-client";
import { createEmailClient, type EmailClient } from "@slyxup/email-client";
import { createAnalyticsClient, type AnalyticsClient } from "@slyxup/analytics-client";
import { createStorageClient, type StorageClient } from "@slyxup/storage-client";
import { createAdminClient, type AdminClient } from "@slyxup/admin-client";
import { createNotificationClient, type NotificationClient } from "@slyxup/notification-client";

export interface SlyxupClient {
  auth: AuthClient;
  billing: BillingClient;
  email: EmailClient;
  analytics: AnalyticsClient;
  storage: StorageClient;
  admin: AdminClient;
  notification: NotificationClient;
}

export interface SlyxupClientConfig {
  apiKey?: string;
  baseUrl?: string;
  authBaseUrl?: string;
  billingBaseUrl?: string;
  emailBaseUrl?: string;
  analyticsBaseUrl?: string;
  storageBaseUrl?: string;
  adminBaseUrl?: string;
  notificationBaseUrl?: string;
}

function baseUrl(config: SlyxupClientConfig, key: keyof SlyxupClientConfig, fallback: string): string {
  return (config[key] as string) ?? config.baseUrl ?? fallback;
}

export function createSlyxupClient(config: SlyxupClientConfig): SlyxupClient {
  return {
    auth: createAuthClient({ baseUrl: baseUrl(config, "authBaseUrl", "https://auth.slyxup.in"), apiKey: config.apiKey }),
    billing: createBillingClient({ baseUrl: baseUrl(config, "billingBaseUrl", "https://billing.slyxup.in"), apiKey: config.apiKey }),
    email: createEmailClient({ baseUrl: baseUrl(config, "emailBaseUrl", "https://email.slyxup.in"), apiKey: config.apiKey }),
    analytics: createAnalyticsClient({ baseUrl: baseUrl(config, "analyticsBaseUrl", "https://analytics.slyxup.in"), apiKey: config.apiKey }),
    storage: createStorageClient({ baseUrl: baseUrl(config, "storageBaseUrl", "https://storage.slyxup.in"), apiKey: config.apiKey }),
    admin: createAdminClient({ baseUrl: baseUrl(config, "adminBaseUrl", "https://admin.slyxup.in"), apiKey: config.apiKey }),
    notification: createNotificationClient({ baseUrl: baseUrl(config, "notificationBaseUrl", "https://notification.slyxup.in"), apiKey: config.apiKey }),
  };
}

export { createAuthClient } from "@slyxup/auth-client";
export { createBillingClient } from "@slyxup/billing-client";
export { createEmailClient } from "@slyxup/email-client";
export { createAnalyticsClient } from "@slyxup/analytics-client";
export { createStorageClient } from "@slyxup/storage-client";
export { createAdminClient } from "@slyxup/admin-client";
export { createNotificationClient } from "@slyxup/notification-client";
