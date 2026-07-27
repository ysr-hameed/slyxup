# @slyxup/sdk

Unified SDK for all Slyxup platform services. Wraps all 7 service clients into a single `createSlyxupClient()` call. Also re-exports every standalone client factory.

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
```

### Auth

```ts
const { token, jwt, user } = await api.auth.login({
  email: "user@example.com",
  password: "Str0ng!",
  platform: "url-shortener",
});
const me = await api.auth.me(jwt);
const sessions = await api.auth.listSessions(jwt);
await api.auth.logout(jwt);
```

### Billing

```ts
const plans = await api.billing.listPlans("url-shortener");
const { url } = await api.billing.createCheckout({
  plan_id: "plan_abc",
  user_id: "user_xyz",
  platform: "url-shortener",
  success_url: "https://url.slyxup.online/success",
  cancel_url: "https://url.slyxup.online/cancel",
});
const sub = await api.billing.getSubscription("user_xyz");
```

### Email

```ts
const { id } = await api.email.send({
  to: ["user@example.com"],
  subject: "Welcome!",
  html: "<p>Hi!</p>",
});
```

### Analytics

```ts
await api.analytics.trackEvent({ name: "signup", platform: "url-shortener" });
await api.analytics.trackPageView({ path: "/", platform: "url-shortener" });
const summary = await api.analytics.getSummary();
```

### Storage

```ts
const { key, url } = await api.storage.upload(file);
const files = await api.storage.list("users/user_xyz/");
```

### Admin

```ts
const stats = await api.admin.getDashboard();
const users = await api.admin.listUsers();
```

### Notification

```ts
await api.notification.send({
  user_id: "user_xyz",
  channel: "email",
  to_address: "user@example.com",
  subject: "Alert",
  body: "Something happened.",
});
const logs = await api.notification.listLogs();
```

## Configuration

You can configure per-service base URLs or use the built-in defaults. Each service falls back to `baseUrl` if its specific URL is not set.

```ts
const api = createSlyxupClient({
  // Fallback for all services
  baseUrl: "https://slyxup.online",

  // Per-service overrides
  authBaseUrl: "https://auth.slyxup.online",
  billingBaseUrl: "https://billing.slyxup.online",
  emailBaseUrl: "https://email.slyxup.online",
  analyticsBaseUrl: "https://analytics.slyxup.online",
  storageBaseUrl: "https://storage.slyxup.online",
  adminBaseUrl: "https://admin.slyxup.online",
  notificationBaseUrl: "https://notification.slyxup.online",

  apiKey: "sk-...", // optional
});
```

## Available services

| Property | Client | Default URL |
|----------|--------|-------------|
| `auth` | `AuthClient` | `https://auth.slyxup.online` |
| `billing` | `BillingClient` | `https://billing.slyxup.online` |
| `email` | `EmailClient` | `https://email.slyxup.online` |
| `analytics` | `AnalyticsClient` | `https://analytics.slyxup.online` |
| `storage` | `StorageClient` | `https://storage.slyxup.online` |
| `admin` | `AdminClient` | `https://admin.slyxup.online` |
| `notification` | `NotificationClient` | `https://notification.slyxup.online` |

## Standalone clients

Every standalone client factory is re-exported from `@slyxup/sdk`:

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

You can also import individual clients directly from their own packages:

```ts
import { createAuthClient } from "@slyxup/auth-client";
import { createBillingClient } from "@slyxup/billing-client";
```
