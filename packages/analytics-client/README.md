# @slyxup/analytics-client

HTTP client for the Slyxup Analytics Service. Tracks custom events and page views across platforms. Backed by D1.

## Installation

```bash
npm install @slyxup/analytics-client
```

## Usage

```ts
import { createAnalyticsClient } from "@slyxup/analytics-client";

const analytics = createAnalyticsClient({
  baseUrl: "https://analytics.slyxup.online",
  apiKey: "sk-...", // required for server-side use
});
```

### Custom events

```ts
await analytics.trackEvent({
  name: "url_created",
  platform: "url-shortener",
  user_id: "user_xyz",          // optional
  properties: { slug: "abc123", isCustom: true },  // optional
});
```

### Page views

```ts
await analytics.trackPageView({
  path: "/dashboard",
  platform: "url-shortener",
  user_id: "user_xyz",            // optional
  referrer: "https://google.com", // optional
});
```

### Summary

```ts
const { totalPageViews } = await analytics.getSummary();
// → { totalPageViews: 12345 }
```

## API

### `createAnalyticsClient(config)`

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `https://analytics.slyxup.online` | Analytics service URL |
| `apiKey` | `string` | — | Service API key (sent as `X-API-Key` header) |

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `trackEvent` | `TrackEventRequest` | `void` |
| `trackPageView` | `{ path, platform, user_id?, referrer? }` | `void` |
| `getSummary` | — | `{ totalPageViews }` |

### Types

```ts
interface TrackEventRequest {
  name: string;                    // event name, max 100 chars
  platform: string;                // platform slug
  user_id?: string;                // optional user association
  properties?: Record<string, unknown>;  // arbitrary event data
}
```

## Error handling

```ts
try {
  await analytics.trackEvent({ name: "", platform: "" });
} catch (err) {
  console.error(err.message);
}
```
