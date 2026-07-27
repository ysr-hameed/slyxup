# URL Shortener — Slyxup test product

Two apps: API (Cloudflare Worker) + Web (React/Vite on Pages).

## Architecture

```
api-url.slyxup.online  ← API (Hono, D1, local JWT verify)
url.slyxup.online      ← Web (React, Tailwind v4, Vite)
```

The API verifies JWTs locally via `verifyToken()` from `@slyxup/shared` (no auth service call per request).

## Local dev

```bash
# API (port 9000)
pnpm --filter @slyxup/url-shortener dev:api

# Web (port 5173)
pnpm --filter @slyxup/url-shortener-web dev
```

The API needs `JWT_SECRET` in `apps/api/.dev.vars` (same value as auth-service).

Frontend URLs are configured in `apps/web/src/config.ts`:

```ts
const AUTH_BASE = import.meta.env.DEV ? "http://localhost:8000" : "https://auth.slyxup.online";
const API_BASE = import.meta.env.DEV ? "http://localhost:9000" : "https://api-url.slyxup.online";
```

## Database (D1)

`slyxup-url-shortener` — `urls` table

Migrations located at `apps/api/migrations/`.

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/url` | Bearer JWT | Create short URL |
| GET | `/api/url` | Bearer JWT | List user's URLs (paginated) |
| DELETE | `/api/url/:id` | Bearer JWT | Delete a URL |
| GET | `/:slug` | — | Redirect to original URL |

### Plan limits

| Tier | Max URLs | Slug length | Expiry |
|------|----------|-------------|--------|
| Free | 10 | 6 chars (auto) | 30 days |
| Pro | 1000 | Custom slugs | Never |
