# @slyxup/sdk

Unified SDK for all Slyxup platform services. Wraps all 7 service clients into a single `createSlyxupClient()` call.

## Installation

```bash
npm install @slyxup/sdk
```

## Usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({
  apiKey: "sk-...", // optional, for server-side calls
});

// Auth
const { token, jwt, user } = await api.auth.login({ email, password });
const me = await api.auth.me(jwt);

// Billing
const plans = await api.billing.listPlans("url-shortener");
const { url } = await api.billing.createCheckout({ ... });

// Email
await api.email.send({ to: [user.email], subject: "Hello", html: "<p>Hi!</p>" });

// Analytics
await api.analytics.trackEvent({ name: "signup", platform: "url-shortener" });
await api.analytics.trackPageView({ path: "/", platform: "url-shortener" });
const summary = await api.analytics.getSummary();

// Storage
const { key } = await api.storage.upload(file);
const files = await api.storage.list();

// Admin
const dashboard = await api.admin.getDashboard();
const adminUsers = await api.admin.listUsers();

// Notification
await api.notification.send({ user_id, channel: "email", to_address, subject, body });
const logs = await api.notification.listLogs();
```

## Configuration

You can configure per-service URLs or use defaults:

```ts
const api = createSlyxupClient({
  baseUrl: "https://slyxup.online",            // fallback for all services
  authBaseUrl: "https://auth.slyxup.online",   // override specific service
  billingBaseUrl: "https://billing.slyxup.online",
  emailBaseUrl: "https://email.slyxup.online",
  analyticsBaseUrl: "https://analytics.slyxup.online",
  storageBaseUrl: "https://storage.slyxup.online",
  adminBaseUrl: "https://admin.slyxup.online",
  notificationBaseUrl: "https://notification.slyxup.online",
  apiKey: "sk-...",
});
```

## Available services

| Property       | Client              | Default URL                       |
|---------------|---------------------|-----------------------------------|
| `auth`        | `AuthClient`        | `https://auth.slyxup.online`      |
| `billing`     | `BillingClient`     | `https://billing.slyxup.online`   |
| `email`       | `EmailClient`       | `https://email.slyxup.online`     |
| `analytics`   | `AnalyticsClient`   | `https://analytics.slyxup.online` |
| `storage`     | `StorageClient`     | `https://storage.slyxup.online`   |
| `admin`       | `AdminClient`       | `https://admin.slyxup.online`     |
| `notification`| `NotificationClient`| `https://notification.slyxup.online` |

## Standalone clients

You can also import individual clients directly:

```ts
import { createAuthClient } from "@slyxup/auth-client";
import { createBillingClient } from "@slyxup/billing-client";
// ... etc
```

All standalone clients are re-exported from `@slyxup/sdk`:

```ts
import {
  createAuthClient,
  createBillingClient,
  createEmailClient,
  createAnalyticsClient,
  createStorageClient,
  createAdminClient,
  createNotificationClient,
} from "@slyxup/sdk";
```
