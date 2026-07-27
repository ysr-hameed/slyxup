# @slyxup/email-client

HTTP client for the Slyxup Email Service. Sends transactional emails via the Brevo API. No database.

## Installation

```bash
npm install @slyxup/email-client
```

## Usage

```ts
import { createEmailClient } from "@slyxup/email-client";

const email = createEmailClient({
  baseUrl: "https://email.slyxup.online",
  apiKey: "sk-...", // required for server-side use
});
```

### Send a plain HTML email

```ts
const { id } = await email.send({
  to: ["user@example.com"],
  subject: "Welcome to Slyxup!",
  html: "<h1>Welcome!</h1><p>Thanks for joining.</p>",
});
```

### Send with plain text fallback

```ts
await email.send({
  to: ["user@example.com"],
  subject: "Reset your password",
  text: "Click here to reset: https://...",
  html: "<p>Click <a href='...'>here</a> to reset.</p>",
});
```

### Send to multiple recipients

```ts
await email.send({
  to: ["admin@example.com", "billing@example.com"],
  subject: "Monthly report",
  html: "<p>Report attached.</p>",
});
```

## API

### `createEmailClient(config)`

| Config | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `https://email.slyxup.online` | Email service URL |
| `apiKey` | `string` | — | Service API key (sent as `X-API-Key` header) |

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `send` | `SendEmailRequest` | `{ id }` |

### `SendEmailRequest`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `to` | `string[]` | yes | Recipient email addresses |
| `subject` | `string` | yes | Email subject line (max 998 chars) |
| `html` | `string` | no | HTML body content |
| `text` | `string` | no | Plain text fallback |
| `template` | `string` | no | Brevo template name |
| `data` | `Record<string, unknown>` | no | Template variables |

## Error handling

```ts
try {
  await email.send({
    to: ["invalid"],
    subject: "Test",
    html: "<p>Hi</p>",
  });
} catch (err) {
  console.error(err.message); // Validation error from API
}
```

## Related packages

- `@slyxup/notification-client` — higher-level notification system with logging
- `@slyxup/sdk` — unified client with all services
