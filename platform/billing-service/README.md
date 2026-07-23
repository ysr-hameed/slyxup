# Billing Service — `billing.slyxup.in`

Manages plans, subscriptions, and Paddle payments.

## SDK Usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ billingBaseUrl: "https://billing.slyxup.in" });

// List plans
const plans = await api.billing.listPlans("my-app");

// Create checkout
const { url } = await api.billing.createCheckout({
  plan_id: plans[0].id,
  user_id: "user_xxx",
  platform: "my-app",
  success_url: "https://myapp.com/success",
  cancel_url: "https://myapp.com/cancel",
});

// Get subscription
const sub = await api.billing.getSubscription("user_xxx");
// Check sub.status → "active" | "canceled" | "past_due"
```

## Database (D1)

`slyxup-billing` — `plans`, `subscriptions`, `invoices`

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/billing/plans` | List plans |
| POST | `/api/billing/create-checkout` | Checkout session |
| POST | `/api/billing/create-portal` | Customer portal |
| GET | `/api/billing/subscription` | Get subscription |
| POST | `/api/billing/webhook` | Paddle webhooks |
| GET | `/api/billing/docs` | Swagger UI |
