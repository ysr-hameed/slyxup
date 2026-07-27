# @slyxup/notification-client

HTTP client for the Slyxup Notification Service. Send notifications via email, SMS, or push channels, with automatic logging. Backed by D1.

## Installation

```bash
npm install @slyxup/notification-client
```

## Usage

```ts
import { createNotificationClient } from "@slyxup/notification-client";

const notifications = createNotificationClient({
  baseUrl: "https://notification.slyxup.online",
  apiKey: "sk-...", // required for server-side use
});
```

### Send a notification

```ts
const log = await notifications.send({
  user_id: "user_xyz",
  channel: "email",
  to_address: "user@example.com",
  subject: "New login detected",
  body: "Your account was logged in from a new device.",
});
// → { id, user_id, channel, to_address, subject, status, error, sent_at, created_at }
```

### List sent notifications

```ts
const logs = await notifications.listLogs();
// → [{ id, user_id, channel, to_address, subject, status, error, sent_at, created_at }]
```

## API

### `createNotificationClient(config)`

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `https://notification.slyxup.online` | Notification service URL |
| `apiKey` | `string` | — | Service API key (sent as `X-API-Key` header) |

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `send` | `SendNotificationRequest` | `NotificationLog` |
| `listLogs` | — | `NotificationLog[]` |

### Types

```ts
interface SendNotificationRequest {
  user_id: string;                         // Target user ID
  channel: "email" | "sms" | "push";      // Delivery channel
  to_address: string;                      // Email, phone number, or device token
  subject?: string;                        // Email subject (for email channel)
  body: string;                            // Message body content
}

interface NotificationLog {
  id: string;
  user_id: string;
  channel: string;
  to_address: string;
  subject: string | null;
  status: string;          // e.g. "sent", "failed"
  error: string | null;    // error message if delivery failed
  sent_at: string | null;
  created_at: string;
}
```

## Error handling

```ts
try {
  await notifications.send({
    user_id: "abc",
    channel: "email",
    to_address: "invalid",
    body: "Hello",
  });
} catch (err) {
  console.error(err.message); // Validation error
}
```
