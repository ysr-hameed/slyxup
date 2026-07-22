# Slyxup Platform Architecture

7 independent Cloudflare Workers, each in its own account. No shared infrastructure.

```
auth.slyxup.in         → Account #1 (Auth)
billing.slyxup.in      → Account #2 (Billing)
email.slyxup.in        → Account #3 (Email)
analytics.slyxup.in    → Account #4 (Analytics)
storage.slyxup.in      → Account #5 (Storage)
notification.slyxup.in → Account #6 (Notification)
admin.slyxup.in        → Account #7 (Admin)
```

## Structure

```
├── packages/
│   ├── shared/          → Types, JWT, crypto, Zod validation, OpenAPI helpers
│   ├── logger/          → Structured JSON logger
│   ├── sdk/             → Unified client wrapping all 7 service clients
│   ├── auth-client/     → Auth service HTTP client
│   ├── billing-client/  → Billing service HTTP client
│   ├── email-client/    → Email service HTTP client
│   ├── analytics-client/→ Analytics service HTTP client
│   ├── storage-client/  → Storage service HTTP client
│   ├── admin-client/    → Admin service HTTP client
│   └── ui/              → Shared React components (Tailwind v4)
│
├── platform/
│   ├── auth-service/        → Auth Worker (Hono + OpenAPI, own D1)
│   ├── billing-service/     → Billing Worker (Paddle, own D1)
│   ├── email-service/       → Email Worker (Brevo API, no DB)
│   ├── analytics-service/   → Analytics Worker (own D1)
│   ├── storage-service/     → Storage Worker (R2, no DB)
│   ├── notification-service/→ Notification Worker (own D1)
│   └── admin-service/       → Admin API Worker (own D1)
```

Every service owns its own schema. Every service can become its own repo without refactoring.

## Service pattern

```
platform/{name}-service/
├── src/
│   ├── index.ts        → OpenAPIHono app, CORS, middlewares
│   ├── db.ts           → Drizzle D1 factory (services with DB only)
│   ├── schema/index.ts → Drizzle ORM tables (services with DB only)
│   ├── routes/         → Route handlers
├── migrations/         → D1 SQL migration files
├── wrangler.jsonc      → Worker config
├── .dev.vars           → Local secrets (gitignored)
├── .dev.vars.example   → Template without secrets
├── package.json
└── tsconfig.json
```

## Database schema per service

| Service      | Tables                                                          |
|--------------|-----------------------------------------------------------------|
| Auth         | users, sessions, oauth_accounts, platforms, platform_memberships |
| Billing      | plans, subscriptions, invoices                                  |
| Analytics    | events, page_views                                              |
| Notification | notification_templates, notification_logs                        |
| Admin        | admin_users, audit_logs                                         |
| Email        | No DB — uses Brevo API directly                                 |
| Storage      | No DB — uses R2 bindings directly                               |

## API endpoints

### Auth (port 8000)
```
POST /api/auth/register         POST /api/auth/login
POST /api/auth/logout           GET  /api/auth/me
GET  /api/auth/verify           GET  /api/auth/google
GET  /api/auth/google/callback
```

### Billing (port 8001)
```
GET  /api/billing/plans         POST /api/billing/create-checkout
POST /api/billing/create-portal GET  /api/billing/subscription
POST /api/billing/webhook
```

### Email (port 8002)
```
POST /api/email/send
```

### Analytics (port 8003)
```
POST /api/analytics/event       POST /api/analytics/pageview
GET  /api/analytics/events      GET  /api/analytics/summary
```

### Storage (port 8004)
```
POST /api/storage/upload        GET  /api/storage/download?key=
GET  /api/storage/list
```

### Notification (port 8006)
```
POST /api/notification/send     GET  /api/notification/logs
```

### Admin (port 8005)
```
GET  /api/admin/dashboard       GET  /api/admin/users
POST /api/admin/users           GET  /api/admin/audit-logs
POST /api/admin/audit-logs
```

## Development

```bash
pnpm install
pnpm --filter @slyxup/auth-service dev         # port 8000
pnpm --filter @slyxup/billing-service dev      # port 8001
pnpm --filter @slyxup/email-service dev        # port 8002
pnpm --filter @slyxup/analytics-service dev    # port 8003
pnpm --filter @slyxup/storage-service dev      # port 8004
pnpm --filter @slyxup/admin-service dev        # port 8005
pnpm --filter @slyxup/notification-service dev # port 8006

# Typecheck one at a time
npx --no-install tsc --noEmit  # from each package directory

# DB migrations
pnpm --filter @slyxup/auth-service exec wrangler d1 migrations apply slyxup-auth --local
pnpm --filter @slyxup/billing-service exec wrangler d1 migrations apply slyxup-billing --local
pnpm --filter @slyxup/analytics-service exec wrangler d1 migrations apply slyxup-analytics --local
pnpm --filter @slyxup/admin-service exec wrangler d1 migrations apply slyxup-admin --local
pnpm --filter @slyxup/notification-service exec wrangler d1 migrations apply slyxup-notification --local
```

## Key conventions

1. **API response format**: `{ success: true, data: {...} }` or `{ success: false, error: "..." }`
2. **Auth**: `Authorization: Bearer <jwt>` for users, `X-API-Key` for services, `X-Admin-Key` for admin
3. **Error handling**: All services use `createHonoErrorHandler()` from `@slyxup/logger`
4. **Logging**: Structured JSON via `@slyxup/logger` — every request logged with method, path, status, duration

## Deployment

Each service deploys independently to its own Cloudflare account:

```bash
pnpm --filter @slyxup/auth-service deploy         # Account #1
pnpm --filter @slyxup/billing-service deploy      # Account #2
pnpm --filter @slyxup/email-service deploy        # Account #3
pnpm --filter @slyxup/analytics-service deploy    # Account #4
pnpm --filter @slyxup/storage-service deploy      # Account #5
pnpm --filter @slyxup/notification-service deploy # Account #6
pnpm --filter @slyxup/admin-service deploy        # Account #7
```

DNS: CNAME records in the `slyxup.in` zone pointing to each Worker's `*.workers.dev` domain.

## SDK usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ apiKey: "sk-..." });
await api.auth.login({ email, password });
await api.billing.listPlans();
await api.storage.upload(file);
await api.notification.send({ ... });
```

## Repository separation

Every `platform/{name}-service/` and `packages/{name}/` is isolated and can be extracted into its own Git repo. No service imports another service's code. The SDK is the only interface consumers ever see.
