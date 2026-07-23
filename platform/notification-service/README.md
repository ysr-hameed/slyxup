# Notification Service — `notification.slyxup.in`

Sends and logs notifications (email, SMS, push).

## SDK Usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ notificationBaseUrl: "https://notification.slyxup.in" });

// Send notification
const result = await api.notification.send({
  user_id: "user_xxx",
  channel: "email",
  to_address: "user@example.com",
  subject: "You have a new message",
  body: "Hello from the platform!",
});

// List logs
const logs = await api.notification.listLogs();
```

## Database (D1)

`slyxup-notification` — `notification_templates`, `notification_logs`

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notification/send` | Send notification |
| GET | `/api/notification/logs` | List notification logs |
| GET | `/api/notification/docs` | Swagger UI |
