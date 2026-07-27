# @slyxup/billing-client

HTTP client for the Slyxup Billing Service. Manages subscription plans, Paddle checkouts, customer portals, and subscriptions.

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
```

### Plans

```ts
// List all plans (optionally filter by platform)
const plans = await billing.listPlans("url-shortener");
// → [{ id, name, description, amount, currency, interval }]

const plansAll = await billing.listPlans();
// → all plans across all platforms
```

| Field | Type | Example |
|-------|------|---------|
| `id` | `string` | `"plan_abc123"` |
| `name` | `string` | `"Pro Monthly"` |
| `description` | `string \| null` | `"Up to 1000 URLs"` |
| `amount` | `number` | `999` (in cents) |
| `currency` | `string` | `"usd"` |
| `interval` | `string` | `"month"` or `"year"` |

### Checkout

```ts
const { url } = await billing.createCheckout({
  plan_id: "plan_abc123",
  user_id: "user_xyz",
  platform: "url-shortener",
  success_url: "https://url.slyxup.online/billing/success",
  cancel_url: "https://url.slyxup.online/billing/cancel",
});
// → redirect user to Paddle checkout at `url`
```

### Subscription

```ts
const sub = await billing.getSubscription("user_xyz");
// → { id, user_id, plan_id, status, current_period_end }
```

| Field | Type | Example |
|-------|------|---------|
| `id` | `string` | `"sub_abc"` |
| `user_id` | `string` | `"user_xyz"` |
| `plan_id` | `string` | `"plan_abc123"` |
| `status` | `string` | `"active"`, `"canceled"`, `"past_due"`, `"incomplete"`, `"trialing"` |
| `current_period_end` | `string \| null` | `"2026-08-26T00:00:00.000Z"` |

## API

### `createBillingClient(config)`

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `https://billing.slyxup.online` | Billing service URL |
| `apiKey` | `string` | — | Service API key (sent as `X-API-Key` header) |

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `listPlans` | `platform?: string` | `Plan[]` |
| `createCheckout` | `CheckoutRequest` | `{ url }` |
| `getSubscription` | `userId: string` | `Subscription` |

### Types

```ts
interface CheckoutRequest {
  plan_id: string;
  user_id: string;
  platform: string;
  success_url: string;
  cancel_url: string;
}
```

## Error handling

```ts
try {
  await billing.getSubscription("nonexistent");
} catch (err) {
  console.error(err.message); // e.g. "Subscription not found"
}
```
