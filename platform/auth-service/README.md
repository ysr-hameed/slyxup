# Auth Service — `auth.slyxup.in`

Handles user registration, login, sessions, and OAuth.

## SDK Usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ authBaseUrl: "https://auth.slyxup.in" });

// Register
await api.auth.register({ email, password, name });

// Login → get JWT
const { jwt, user } = await api.auth.login({ email, password, platform: "my-app" });

// Verify token (e.g. from Authorization header)
const me = await api.auth.me(jwt);
```

## Database (D1)

`slyxup-auth` — `users`, `sessions`, `oauth_accounts`, `platforms`, `platform_memberships`

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/logout` | Revoke session |
| GET | `/api/auth/me` | Current user (Bearer JWT) |
| GET | `/api/auth/verify` | Verify email |
| GET | `/api/auth/google` | Google OAuth |
| GET | `/api/auth/google/callback` | OAuth callback |
| GET | `/api/auth/docs` | Swagger UI |
