# Auth Service — `auth.slyxup.online`

Handles user registration, login, sessions, OAuth (Google, GitHub), password management, and email verification.

## Local dev

```bash
pnpm --filter @slyxup/auth-service dev      # http://localhost:8000
```

Required `.dev.vars`:

```
JWT_SECRET=dev-secret-key-change-in-production
API_KEY=sk-slyxup-s1785136484
APP_DOMAIN=http://localhost:5173
EMAIL_SERVICE_URL=http://localhost:8002
BREVO_API_KEY=your-brevo-key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

Verification/reset links are logged to the console in dev mode (email service might not be running).

## Database (D1)

`slyxup-auth` — `users`, `sessions`, `oauth_accounts`, `platforms`, `platform_memberships`

## API

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account (verification token emailed) |
| POST | `/api/auth/login` | — | Login → JWT (15min) + session (30d) |
| POST | `/api/auth/logout` | Bearer JWT | Revoke current session |
| POST | `/api/auth/refresh` | Bearer JWT | Exchange session token for new JWT |
| POST | `/api/auth/logout-all` | Bearer JWT | Revoke all sessions |
| GET | `/api/auth/me` | Bearer JWT | Get profile |
| PATCH | `/api/auth/me` | Bearer JWT | Update name/avatar |
| DELETE | `/api/auth/me` | Bearer JWT | Soft-delete account |
| GET | `/api/auth/verify?token=` | — | Verify email |
| POST | `/api/auth/change-password` | Bearer JWT | Change password |
| POST | `/api/auth/forgot-password` | — | Send reset email (generic response) |
| POST | `/api/auth/reset-password` | — | Reset with token |
| POST | `/api/auth/resend-verification` | — | Resend verification email |
| GET | `/api/auth/google` | — | Google OAuth redirect |
| GET | `/api/auth/google/callback` | — | Google OAuth callback |
| GET | `/api/auth/github` | — | GitHub OAuth redirect |
| GET | `/api/auth/github/callback` | — | GitHub OAuth callback |
| GET | `/api/auth/sessions` | Bearer JWT | List active sessions |
| DELETE | `/api/auth/sessions/:id` | Bearer JWT | Revoke specific session |

## SDK Usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ authBaseUrl: "https://auth.slyxup.online" });

// Register
await api.auth.register({ email, password, name });

// Login → get JWT
const { jwt, user } = await api.auth.login({ email, password, platform: "my-app" });

// Verify token (e.g. from Authorization header)
const me = await api.auth.me(jwt);
```

## Security

- Password: upper + lower + number, min 8 chars
- Account lockout: 5 failed attempts → 15min block
- JWT: 15min expiry
- Rate limiting: 60 req/min per IP (via shared middleware)
- Email verification required for login
- Service-to-service: `X-API-Key` header
