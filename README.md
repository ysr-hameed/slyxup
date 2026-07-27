# Slyxup Platform

7 isolated Cloudflare Workers + SDK for building multi-tenant SaaS products.

## Structure

```
slyxup.in/
├── packages/              # Shared libraries (10 packages)
│   ├── shared/            # Types, JWT, crypto, Zod validation, OpenAPI helpers
│   ├── logger/            # Structured JSON logger
│   ├── sdk/               # Unified client wrapping all 7 service clients
│   ├── auth-client/       # Auth API HTTP client
│   ├── billing-client/    # Billing API HTTP client
│   ├── email-client/      # Email API HTTP client
│   ├── analytics-client/  # Analytics API HTTP client
│   ├── storage-client/    # Storage API HTTP client
│   ├── admin-client/      # Admin API HTTP client
│   └── notification-client/ # Notification API HTTP client
│   └── ui/                # Shared React components (Button, Input, Card, Badge, Navbar, AuthGuard)
│
├── platform/             # 7 Cloudflare Workers (one per account)
│   ├── auth-service/     # Auth: register, login, logout, Google OAuth, JWT
│   ├── billing-service/  # Billing: Paddle plans, subscriptions, invoices, webhooks
│   ├── email-service/    # Email: transactional emails via Brevo API
│   ├── analytics-service/ # Analytics: custom events + page views
│   ├── storage-service/  # Storage: file upload/download via R2
│   ├── admin-service/    # Admin: user management, audit logs
│   └── notification-service/ # Notification: templates, send, logs
│
├── products/             # SaaS products consuming the SDK
│   └── url-shortener/    # Test product: demo of SDK + platform usage
│       ├── apps/api/     # Cloudflare Worker (Hono) — POST/GET /api/url, redirect
│       └── apps/web/     # React + Vite frontend
│
├── start.sh              # Start/stop/log/status all services
├── AGENTS.md             # Full architecture reference for AI coding agents
└── pnpm-workspace.yaml   # Monorepo config
```

## How it works

Each `platform/<name>-service/` is an independent Cloudflare Worker with its own D1 database (except email + storage which use Brevo/R2 directly). They communicate **only** via HTTP. No service imports another service's code.

Products use `@slyxup/sdk` to call platform services:

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ apiKey: "sk-..." });
await api.auth.login({ email, password });
await api.billing.listPlans();
await api.storage.upload(file);
```

### Worker domains (production)

| Service | Domain | Account |
|---------|--------|---------|
| Auth | auth.slyxup.online | #1 |
| Billing | billing.slyxup.online | #2 |
| Email | email.slyxup.online | #3 |
| Analytics | analytics.slyxup.online | #4 |
| Storage | storage.slyxup.online | #5 |
| Admin | admin.slyxup.online | #6 |
| Notification | notification.slyxup.online | #7 |

### Dev ports

| Service | Port |
|---------|------|
| auth-service | 8000 |
| billing-service | 8001 |
| email-service | 8002 |
| analytics-service | 8003 |
| storage-service | 8004 |
| admin-service | 8005 |
| notification-service | 8006 |
| url-shortener (product) | 9000 |

## Database schemas

| Service | Tables |
|---------|--------|
| **Auth** | users, sessions, oauth_accounts, platforms, platform_memberships |
| **Billing** | plans, subscriptions, invoices |
| **Analytics** | events, page_views |
| **Admin** | admin_users, audit_logs |
| **Notification** | notification_templates, notification_logs |
| Email | No DB (Brevo API) |
| Storage | No DB (R2) |

Each service owns its own schema in `src/schema/index.ts` and SQL migrations in `migrations/`.

## Quick start

```bash
# Start all platform services
./start.sh start core

# Start a single service
./start.sh start auth-service

# Start URL shortener product
./start.sh start url-shortener

# Start everything at once
./start.sh start all
```

### start.sh commands

```
./start.sh start [scope]   Start services (core, product, all, or <name>)
./start.sh stop [scope]    Stop services (all, <name>, or <port>)
./start.sh status          Show what's running
./start.sh logs [name]     Tail logs (default: auth)
```

## Manual test walkthrough

```bash
# 1. Start auth + url-shortener
./start.sh start auth-service
./start.sh start url-shortener

# 2. Register a user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","platform":"url-shortener"}'

# 3. Login → get JWT
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","platform":"url-shortener"}'

# 4. Create short URL (uses SDK: auth.me + billing.getSubscription + analytics.trackEvent)
curl -X POST http://localhost:9000/api/url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt>" \
  -d '{"url":"https://example.com/very/long/path"}'

# 5. List URLs (uses SDK: auth.me)
curl http://localhost:9000/api/url \
  -H "Authorization: Bearer <jwt>"

# 6. Test redirect (uses SDK: analytics.trackPageView)
curl -v http://localhost:9000/<slug>
# → 302 Found → Location: https://example.com/very/long/path
```

## Platform service pattern

Every service follows the same structure:

```
platform/{name}-service/
├── src/
│   ├── index.ts        → OpenAPIHono app, CORS, middlewares
│   ├── db.ts           → Drizzle D1 factory (services with DB only)
│   ├── schema/index.ts → Drizzle ORM tables (services with DB only)
│   └── routes/         → Route handlers (one file per endpoint group)
├── migrations/         → D1 SQL migration files
├── wrangler.jsonc      → Worker config
├── .dev.vars           → Local secrets (gitignored)
├── .dev.vars.example   → Template without secrets
├── package.json
└── tsconfig.json
```

### API response format

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "..." }
```

### Auth headers

| Header | Purpose |
|--------|---------|
| `Authorization: Bearer <jwt>` | User auth |
| `X-API-Key` | Service-to-service |
| `X-Admin-Key` | Admin endpoints |

## Shared secrets

Services that need to talk are connected via shared secrets. The `.env.prod` file at the project root tracks the canonical values:

| Secret | Used by | Purpose |
|--------|---------|---------|
| `API_KEY` | auth-service → email-service | Auth sends verification/reset emails through email-service |
| `JWT_SECRET` | auth-service, admin-service, url-shortener API | JWT signing and local verification |

Set each secret on every worker that needs it:
```bash
cat .env.prod | grep API_KEY | cut -d= -f2- | tr -d ' ' | xargs -I{} sh -c 'echo -n "{}" | wrangler secret put API_KEY --name slyxup-auth'
cat .env.prod | grep JWT_SECRET | cut -d= -f2- | tr -d ' ' | xargs -I{} sh -c 'echo -n "{}" | wrangler secret put JWT_SECRET --name slyxup-url-shortener'
```

For local dev, add the required secrets to each service's `.dev.vars`.

## Local development tips

### Email/password flow locally
Since the email service is only available in production, verification/reset links are
logged to the server console in development mode. After registering, check the auth service
logs for:
```
{"level":"info","message":"dev_verification_link","verifyLink":"http://localhost:5173/verify?token=..."}
```

Make sure `APP_DOMAIN` is set in `platform/auth-service/.dev.vars`:
```
APP_DOMAIN=http://localhost:5173
```

### Missing DB tables locally
If a service returns `D1_ERROR: no such table`, apply its migrations:
```bash
pnpm --filter @slyxup/<service-name> exec wrangler d1 migrations apply slyxup-<db-name> --local
```

For the URL shortener API (uses product-level wrangler config):
```bash
pnpm --filter @slyxup/url-shortener exec wrangler d1 migrations apply slyxup-url-shortener --local --config apps/api/wrangler.jsonc
```

## Known issues

- **pnpm install crashes** (OOM/SIGTERM kills the process). Manual symlinks are maintained for typechecks instead.
- Typecheck one package at a time: `cd packages/sdk && npx tsc --noEmit` (or use the filter).

## Deployment

Each service deploys independently. Before deploying, ensure required secrets are set on the target worker:

```bash
# List current secrets
npx wrangler secret list --name slyxup-auth

# Set API_KEY on auth (needed to call email service)
echo -n "sk-slyxup-s1785136484" | wrangler secret put API_KEY --name slyxup-auth

# Set API_KEY on email (needed to accept requests from auth)
echo -n "sk-slyxup-s1785136484" | wrangler secret put API_KEY --name slyxup-email

# Set JWT_SECRET on url-shortener API (local JWT verification)
echo -n "your-jwt-secret" | wrangler secret put JWT_SECRET --name slyxup-url-shortener
```

Then deploy:

```bash
pnpm --filter @slyxup/auth-service deploy         # auth.slyxup.online
pnpm --filter @slyxup/billing-service deploy      # billing.slyxup.online
pnpm --filter @slyxup/email-service deploy        # email.slyxup.online
pnpm --filter @slyxup/analytics-service deploy    # analytics.slyxup.online
pnpm --filter @slyxup/storage-service deploy      # storage.slyxup.online
pnpm --filter @slyxup/admin-service deploy        # admin.slyxup.online
pnpm --filter @slyxup/notification-service deploy # notification.slyxup.online
pnpm --filter @slyxup/url-shortener deploy:api    # api-url.slyxup.online
pnpm --filter @slyxup/url-shortener deploy:web    # url.slyxup.online (Pages)
```

## API endpoints

### Auth (8000)
```
POST /api/auth/register            POST /api/auth/login
POST /api/auth/logout              POST /api/auth/refresh
POST /api/auth/logout-all          GET  /api/auth/me
PATCH /api/auth/me                 DELETE /api/auth/me
GET  /api/auth/verify              POST /api/auth/change-password
POST /api/auth/forgot-password     POST /api/auth/reset-password
POST /api/auth/resend-verification GET  /api/auth/google
GET  /api/auth/google/callback     GET  /api/auth/github
GET  /api/auth/github/callback     GET  /api/auth/sessions
DELETE /api/auth/sessions/:id
```

### Billing (8001)
```
GET  /api/billing/plans           POST /api/billing/create-checkout
POST /api/billing/create-portal   GET  /api/billing/subscription
POST /api/billing/webhook
```

### Email (8002)
```
POST /api/email/send
```

### Analytics (8003)
```
POST /api/analytics/event         POST /api/analytics/pageview
GET  /api/analytics/events        GET  /api/analytics/summary
```

### Storage (8004)
```
POST /api/storage/upload   GET /api/storage/download?key=
GET  /api/storage/list
```

### Admin (8005)
```
GET  /api/admin/dashboard   GET  /api/admin/users
POST /api/admin/users       GET  /api/admin/audit-logs
POST /api/admin/audit-logs
```

### Notification (8006)
```
POST /api/notification/send   GET /api/notification/logs
```

### URL Shortener product (9000)
```
POST /api/url   (create short URL — SDK: auth.me + billing.getSubscription + analytics.trackEvent)
GET  /api/url   (list my URLs — SDK: auth.me)
GET  /:slug     (redirect — SDK: analytics.trackPageView)
```
