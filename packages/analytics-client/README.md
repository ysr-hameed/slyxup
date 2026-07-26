# @slyxup/analytics-client

HTTP client for the Slyxup Analytics Service. Tracks events and page views across platforms.

## Installation

```bash
npm install @slyxup/analytics-client
```

## Usage

```ts
import { createAnalyticsClient } from "@slyxup/analytics-client";

const analytics = createAnalyticsClient({
  baseUrl: "https://analytics.slyxup.online",
  apiKey: "sk-...", // required
});

// Track a custom event
await analytics.trackEvent({
  name: "url_created",
  platform: "url-shortener",
  user_id: "user_xyz",
  properties: { slug: "abc123", isCustom: true },
});

// Track a page view
await analytics.trackPageView({
  path: "/dashboard",
  platform: "url-shortener",
  user_id: "user_xyz",
  referrer: "https://google.com",
});

// Get summary stats
const { totalPageViews } = await analytics.getSummary();
```

## API

### `createAnalyticsClient(config)`

| Config    | Type     | Default                           | Description |
|-----------|----------|-----------------------------------|-------------|
| `baseUrl` | `string` | `https://analytics.slyxup.online` | Analytics service URL |
| `apiKey`  | `string` | —                                 | Service API key |

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `trackEvent` | `TrackEventRequest` | `void` |
| `trackPageView` | `{ path, platform, user_id?, referrer? }` | `void` |
| `getSummary` | — | `{ totalPageViews }` |
