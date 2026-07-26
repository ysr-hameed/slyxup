# @slyxup/billing-client

HTTP client for the Slyxup Billing Service. Manages subscription plans, Paddle checkouts, and subscriptions.

## Installation

```bash
npm install @slyxup/billing-client
```

## Usage

```ts
import { createBillingClient } from "@slyxup/billing-client";

const billing = createBillingClient({
  baseUrl: "https://billing.slyxup.online",
  apiKey: "sk-...", // required for server-side use
});

// List plans
const plans = await billing.listPlans("url-shortener");

// Create checkout
const { url } = await billing.createCheckout({
  plan_id: "plan_abc123",
  user_id: "user_xyz",
  platform: "url-shortener",
  success_url: "https://url.slyxup.online/billing/success",
  cancel_url: "https://url.slyxup.online/billing/cancel",
});

// Get subscription
const sub = await billing.getSubscription("user_xyz");
```

## API

### `createBillingClient(config)`

| Config    | Type     | Default                        | Description |
|-----------|----------|--------------------------------|-------------|
| `baseUrl` | `string` | `https://billing.slyxup.online`| Billing service URL |
| `apiKey`  | `string` | —                              | Service API key |

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `listPlans` | `platform?: string` | `Plan[]` |
| `createCheckout` | `CheckoutRequest` | `{ url }` |
| `getSubscription` | `userId: string` | `Subscription` |
