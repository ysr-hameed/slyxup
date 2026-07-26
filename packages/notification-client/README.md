# @slyxup/notification-client

HTTP client for the Slyxup Notification Service. Send notifications via email, SMS, or push.

## Installation

```bash
npm install @slyxup/notification-client
```

## Usage

```ts
import { createNotificationClient } from "@slyxup/notification-client";

const notifications = createNotificationClient({
  baseUrl: "https://notification.slyxup.online",
  apiKey: "sk-...", // required
});

// Send an email notification
const log = await notifications.send({
  user_id: "user_xyz",
  channel: "email",
  to_address: "user@example.com",
  subject: "New login detected",
  body: "Your account was logged in from a new device.",
});

// List sent notifications
const logs = await notifications.listLogs();
// [{ id, user_id, channel, to_address, subject, status, error, sent_at, created_at }]
```

## API

### `createNotificationClient(config)`

| Config    | Type     | Default                               | Description |
|-----------|----------|---------------------------------------|-------------|
| `baseUrl` | `string` | `https://notification.slyxup.online`  | Notification service URL |
| `apiKey`  | `string` | —                                     | Service API key |

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `send` | `SendNotificationRequest` | `NotificationLog` |
| `listLogs` | — | `NotificationLog[]` |

### `SendNotificationRequest`

| Field        | Type     | Required | Description |
|-------------|---------|----------|-------------|
| `user_id`   | `string` | yes     | Target user ID |
| `channel`   | `"email" \| "sms" \| "push"` | yes | Delivery channel |
| `to_address`| `string` | yes     | Email, phone, or device token |
| `subject`   | `string` | no      | Email subject |
| `body`      | `string` | yes     | Message body content |
