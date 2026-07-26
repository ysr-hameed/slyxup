# @slyxup/email-client

HTTP client for the Slyxup Email Service. Sends transactional emails via Brevo API.

## Installation

```bash
npm install @slyxup/email-client
```

## Usage

```ts
import { createEmailClient } from "@slyxup/email-client";

const email = createEmailClient({
  baseUrl: "https://email.slyxup.online",
  apiKey: "sk-...", // required
});

// Send a plain HTML email
const { id } = await email.send({
  to: ["user@example.com"],
  subject: "Welcome to Slyxup!",
  html: "<h1>Welcome!</h1><p>Thanks for joining.</p>",
});

// Send with plain text fallback
await email.send({
  to: ["user@example.com"],
  subject: "Reset your password",
  text: "Click here to reset: https://...",
  html: "<p>Click <a href='...'>here</a> to reset.</p>",
});

// Send using a template
await email.send({
  to: ["user@example.com"],
  subject: "Your invoice",
  template: "invoice",
  data: { amount: 29.99, date: "2026-07-26" },
});
```

## API

### `createEmailClient(config)`

| Config    | Type     | Default                       | Description |
|-----------|----------|-------------------------------|-------------|
| `baseUrl` | `string` | `https://email.slyxup.online` | Email service URL |
| `apiKey`  | `string` | —                             | Service API key |

### Methods

| Method | Parameters | Returns |
|--------|-----------|---------|
| `send` | `SendEmailRequest` | `{ id }` |

### `SendEmailRequest`

| Field      | Type       | Required | Description |
|------------|-----------|----------|-------------|
| `to`       | `string[]` | yes      | Recipient email addresses |
| `subject`  | `string`   | yes      | Email subject (max 998 chars) |
| `html`     | `string`   | no       | HTML body |
| `text`     | `string`   | no       | Plain text body |
| `template` | `string`   | no       | Template name |
| `data`     | `object`   | no       | Template variables |
