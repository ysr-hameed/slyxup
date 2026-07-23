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
| Auth | auth.slyxup.in | #1 |
| Billing | billing.slyxup.in | #2 |
| Email | email.slyxup.in | #3 |
| Analytics | analytics.slyxup.in | #4 |
| Storage | storage.slyxup.in | #5 |
| Admin | admin.slyxup.in | #6 |
| Notification | notification.slyxup.in | #7 |

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

## Known issues

- **pnpm install crashes** (OOM/SIGTERM kills the process). Manual symlinks are maintained for typechecks instead.
- Typecheck one package at a time: `cd packages/sdk && npx tsc --noEmit` (or use the filter).

## Deployment

Each service deploys independently to its own Cloudflare account:

```bash
pnpm --filter @slyxup/auth-service deploy         # Account #1
pnpm --filter @slyxup/billing-service deploy      # Account #2
pnpm --filter @slyxup/url-shortener deploy        # Product
```

DNS: CNAME records in `slyxup.in` zone → `*.workers.dev` domains.

## API endpoints

### Auth (8000)
```
POST /api/auth/register  POST /api/auth/login
POST /api/auth/logout    GET  /api/auth/me
GET  /api/auth/verify    GET  /api/auth/google
GET  /api/auth/google/callback
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
