# Email Service — `email.slyxup.online`

Sends transactional emails via Brevo (formerly Sendinblue). No database.

## Local dev

```bash
pnpm --filter @slyxup/email-service dev      # http://localhost:8002
```

Required `.dev.vars`:

```
API_KEY=sk-slyxup-s1785136484
BREVO_API_KEY=your-brevo-key
```

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/email/send` | `X-API-Key` | Send transactional email via Brevo |

### POST `/api/email/send`

```json
{
  "to": ["user@example.com"],
  "subject": "Welcome!",
  "html": "<h1>Hello!</h1>",
  "text": "Hello!"
}
```

## SDK Usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ emailBaseUrl: "https://email.slyxup.online" });

const { id } = await api.email.send({
  to: ["user@example.com"],
  subject: "Welcome to MyApp",
  html: "<h1>Hello!</h1><p>Thanks for signing up.</p>",
});
```
