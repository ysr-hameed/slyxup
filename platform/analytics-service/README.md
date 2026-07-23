# Analytics Service — `analytics.slyxup.in`

Tracks custom events and page views.

## SDK Usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ analyticsBaseUrl: "https://analytics.slyxup.in" });

// Track event
await api.analytics.trackEvent({
  name: "signup_completed",
  platform: "my-app",
  user_id: "user_xxx",
  properties: { plan: "pro" },
});

// Track page view
await api.analytics.trackPageView({
  path: "/pricing",
  platform: "my-app",
  user_id: "user_xxx",
});

// Get summary
const summary = await api.analytics.getSummary();
// → { totalPageViews: 1234 }
```

## Database (D1)

`slyxup-analytics` — `events`, `page_views`

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analytics/event` | Track event |
| POST | `/api/analytics/pageview` | Track page view |
| GET | `/api/analytics/events` | List events |
| GET | `/api/analytics/summary` | Summary stats |
| GET | `/api/analytics/docs` | Swagger UI |
