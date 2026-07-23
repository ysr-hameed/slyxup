# Email Service — `email.slyxup.in`

Sends transactional emails via Brevo (formerly Sendinblue). No database.

## SDK Usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ emailBaseUrl: "https://email.slyxup.in" });

// Send email
const { id } = await api.email.send({
  to: ["user@example.com"],
  subject: "Welcome to MyApp",
  html: "<h1>Hello!</h1><p>Thanks for signing up.</p>",
  text: "Hello! Thanks for signing up.",
});
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/email/send` | Send email |
| GET | `/api/email/docs` | Swagger UI |
