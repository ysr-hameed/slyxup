# @slyxup/sdk — Unified Client for All Platform Services

The only interface products ever need. Wraps all 7 platform services into a single `createSlyxupClient()` call.

## Install

```json
// package.json
{
  "dependencies": {
    "@slyxup/sdk": "workspace:*"
  }
}
```

## Usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({
  apiKey: "sk-...",                    // optional service key
  authBaseUrl: "https://auth.slyxup.in",
  billingBaseUrl: "https://billing.slyxup.in",
  emailBaseUrl: "https://email.slyxup.in",
  analyticsBaseUrl: "https://analytics.slyxup.in",
  storageBaseUrl: "https://storage.slyxup.in",
  adminBaseUrl: "https://admin.slyxup.in",
});

// Or with defaults (all point to *.slyxup.in)
const api = createSlyxupClient({ apiKey: "sk-..." });
```

## Available Methods

### Auth — `api.auth`

```ts
// Register a new user
const { id, email } = await api.auth.register({
  email: "user@example.com",
  password: "secure-password",
  name: "John Doe",
  platform: "my-app",
});

// Login
const { token, jwt, user } = await api.auth.login({
  email: "user@example.com",
  password: "secure-password",
  platform: "my-app",
});

// Get current user (pass the JWT from login)
const me = await api.auth.me(jwt);
// → { id, email, name, avatarUrl }

// Logout
await api.auth.logout();
```

### Billing — `api.billing`

```ts
// List available plans
const plans = await api.billing.listPlans("my-app");

// Create checkout session
const { url } = await api.billing.createCheckout({
  plan_id: "plan_xxx",
  user_id: "user_xxx",
  platform: "my-app",
  success_url: "https://myapp.com/success",
  cancel_url: "https://myapp.com/cancel",
});

// Get subscription status
const sub = await api.billing.getSubscription("user_xxx");
// → { id, user_id, plan_id, status, current_period_end }
```

### Email — `api.email`

```ts
const { id } = await api.email.send({
  to: ["user@example.com"],
  subject: "Welcome!",
  html: "<h1>Hello</h1>",
  text: "Hello",
});
```

### Analytics — `api.analytics`

```ts
// Track custom event
await api.analytics.trackEvent({
  name: "url_created",
  platform: "my-app",
  user_id: "user_xxx",
  properties: { slug: "abc123" },
});

// Track page view
await api.analytics.trackPageView({
  path: "/pricing",
  platform: "my-app",
  user_id: "user_xxx",
});

// Get summary
const summary = await api.analytics.getSummary();
```

### Storage — `api.storage`

```ts
// Upload file
const { key, url } = await api.storage.upload(file, "optional-key");

// Get download URL
const downloadUrl = api.storage.getDownloadUrl("file-key");

// List files
const files = await api.storage.list("prefix/");
```

### Notification — `api.notification`

```ts
// Send a notification
await api.notification.send({
  user_id: "user_xxx",
  channel: "email",
  to_address: "user@example.com",
  subject: "Welcome!",
  body: "Thanks for joining!",
});

// List notification logs
const logs = await api.notification.listLogs();
```

### Admin — `api.admin`

```ts
// Dashboard stats
const stats = await api.admin.getDashboard();

// List admin users
const users = await api.admin.listUsers();

// Create admin
const admin = await api.admin.createUser("admin@example.com", "Admin", "superadmin");

// Audit logs
const logs = await api.admin.listAuditLogs();
await api.admin.createAuditLog("admin_id", "user.deleted", "users", "Deleted user abc");
```

## In a Product (Worker)

```ts
import { createSlyxupClient } from "@slyxup/sdk";

type Env = {
  AUTH_SERVICE_URL: string;
  BILLING_SERVICE_URL: string;
  EMAIL_SERVICE_URL: string;
  ANALYTICS_SERVICE_URL: string;
  STORAGE_SERVICE_URL: string;
  NOTIFICATION_SERVICE_URL: string;
};

export default {
  async fetch(req, env) {
    const api = createSlyxupClient({
      authBaseUrl: env.AUTH_SERVICE_URL,
      billingBaseUrl: env.BILLING_SERVICE_URL,
      emailBaseUrl: env.EMAIL_SERVICE_URL,
      analyticsBaseUrl: env.ANALYTICS_SERVICE_URL,
      storageBaseUrl: env.STORAGE_SERVICE_URL,
      notificationBaseUrl: env.NOTIFICATION_SERVICE_URL,
    });

    const auth = req.headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const user = await api.auth.me(auth.slice(7));
      const sub = await api.billing.getSubscription(user.id);
      // ... business logic
    }
  },
};
```
