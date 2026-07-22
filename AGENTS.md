# Slyxup Platform — Architecture Guide

## Overview

Slyxup is a multi-account SaaS platform where **every core service** runs in its own Cloudflare account for isolation and separate free quotas.

```
auth.slyxup.in      → Account #1 (Auth Service)
billing.slyxup.in   → Account #2 (Billing/Payment Service)
email.slyxup.in     → Account #3 (Email Service)
analytics.slyxup.in → Account #4 (Analytics Service)
storage.slyxup.in   → Account #5 (R2 File Service)
admin.slyxup.in     → Account #6 (Admin Panel)
```

Products (task, crm, forms) are independent repos that consume the SDK.

## Structure

```
├── packages/
│   ├── shared/           → Types, JWT, crypto, Zod validation, OpenAPI helpers
│   ├── logger/           → Structured JSON logger
│   ├── sdk/              → Unified client wrapping all services
│   ├── auth-client/      → Auth service HTTP client
│   ├── billing-client/   → Billing service HTTP client
│   ├── email-client/     → Email service HTTP client
│   ├── analytics-client/ → Analytics service HTTP client
│   ├── storage-client/   → Storage service HTTP client
│   └── ui/               → Shared React components (Tailwind v4)
│
├── platform/
│   ├── auth-service/     → Auth Worker (Hono + OpenAPI, own D1 schema)
│   ├── billing-service/  → Billing Worker (Paddle, own D1 schema)
│   ├── email-service/    → Email Worker (Brevo API, no DB)
│   ├── analytics-service/→ Analytics Worker (D1, own schema)
│   ├── storage-service/  → Storage Worker (R2, no DB)
│   └── admin-service/    → Admin API Worker (D1, own schema)
│
├── products/
│   ├── admin/            → Admin React SPA (Vite + Tailwind)
│   └── _template/        → Scaffold for new SaaS apps (api + web)
```

Each platform service manages its **own database schema** locally at `src/schema/index.ts` with a `src/db.ts` factory. No shared `@slyxup/database` package.

## Tech Stack

- **Runtime**: Cloudflare Workers (ES modules)
- **API Framework**: Hono + @hono/zod-openapi
- **Database**: D1 + Drizzle ORM (SQLite), per-service schema
- **Auth**: JWT (HS256) + Session tokens + Google OAuth
- **Payments**: Paddle (adapter pattern for Stripe/Razorpay)
- **Email**: Brevo API (formerly Sendinblue)
- **Storage**: R2 (S3-compatible)
- **Frontend**: React 19 + Vite + Tailwind v4
- **Package Manager**: pnpm workspaces
- **Language**: TypeScript (strict mode)

## Service Patterns

Every platform service follows the same pattern:

```
platform/{name}-service/
├── src/
│   ├── index.ts          → OpenAPIHono app, CORS, middlewares
│   ├── db.ts             → Drizzle D1 factory
│   ├── schema/index.ts   → Drizzle ORM schema tables
│   ├── routes/           → Route handlers (one file per resource)
├── migrations/           → D1 SQL migration files
├── wrangler.jsonc        → Worker configuration
├── .dev.vars             → Local env values (real secrets)
├── .dev.vars.example     → Local env template (no secrets)
├── package.json          → Dependencies
└── tsconfig.json         → TypeScript config
```

### Pattern for services with DB (auth, billing, analytics, admin)
```ts
// db.ts
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema/index";
export function createDb(db: D1Database) {
  return drizzle(db, { schema });
}
```
```ts
// schema/index.ts
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
export const users = sqliteTable("users", { ... });
```

### Pattern for services without DB (email, storage)
No `db.ts` or `schema/` — use env bindings directly (BREVO_API_KEY, R2, etc.).

## Key Conventions

### 1. Import Pattern — SDK Clients (for products)
```ts
import { createSlyxupClient } from "@slyxup/sdk";
const api = createSlyxupClient({ apiKey: "..." });
```

### 2. Import Pattern — Platform Services
```ts
import { setupOpenApi, generateId } from "@slyxup/shared";
import { logger, createHonoErrorHandler } from "@slyxup/logger";
// Local schema
import { createDb } from "./db";
import * as schema from "./schema/index";
```

### 3. API Response Format
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "message" }
```

### 4. Authentication
- **Service-to-service**: `X-API-Key` header
- **User-to-service**: `Authorization: Bearer <jwt>` header
- **Admin**: `X-Admin-Key` header or JWT

### 5. Error Handling
All services use `createHonoErrorHandler()` from `@slyxup/logger`.

### 6. Logging
Structured JSON logging via `@slyxup/logger`. Every request is logged with method, path, status, and duration.

## Database (D1 per Service)

| Service    | Tables                          | Schema file                          |
|------------|---------------------------------|--------------------------------------|
| Auth       | users, sessions, oauth_accounts, platforms, platform_memberships | `platform/auth-service/src/schema/index.ts` |
| Billing    | plans, subscriptions, invoices  | `platform/billing-service/src/schema/index.ts` |
| Analytics  | events, page_views              | `platform/analytics-service/src/schema/index.ts` |
| Admin      | admin_users, audit_logs         | `platform/admin-service/src/schema/index.ts` |

Email and Storage have no DB — they use Brevo API and R2 bindings directly.

Migrations: `pnpm --filter @slyxup/{service}-service exec wrangler d1 migrations apply slyxup-{service} --local`

## Development

```bash
# Install
pnpm install

# Run all services in parallel
pnpm --filter @slyxup/auth-service dev       # port 8000
pnpm --filter @slyxup/billing-service dev    # port 8001
pnpm --filter @slyxup/email-service dev      # port 8002
pnpm --filter @slyxup/analytics-service dev  # port 8003
pnpm --filter @slyxup/storage-service dev    # port 8004
pnpm --filter @slyxup/admin-service dev      # port 8005

# Admin web app
pnpm --filter @slyxup/admin-web dev          # port 5173 (Vite default)

# Typecheck all
pnpm -r typecheck

# DB migrations (local)
pnpm --filter @slyxup/auth-service exec wrangler d1 migrations apply slyxup-auth --local
pnpm --filter @slyxup/billing-service exec wrangler d1 migrations apply slyxup-billing --local
pnpm --filter @slyxup/analytics-service exec wrangler d1 migrations apply slyxup-analytics --local
pnpm --filter @slyxup/admin-service exec wrangler d1 migrations apply slyxup-admin --local
```

## API Endpoints

### Auth (`auth.slyxup.in`)
```
POST   /api/auth/register          — Create account
POST   /api/auth/login             — Email/password login
POST   /api/auth/logout            — Revoke session
GET    /api/auth/me                — Current user (JWT)
GET    /api/auth/verify            — Verify email
GET    /api/auth/google            — Google OAuth login
GET    /api/auth/google/callback   — OAuth callback
GET    /api/auth/docs              — Swagger UI
```

### Billing (`billing.slyxup.in`)
```
GET    /api/billing/plans          — List plans
POST   /api/billing/create-checkout— Create checkout
POST   /api/billing/create-portal  — Customer portal
GET    /api/billing/subscription   — Get subscription
POST   /api/billing/webhook        — Paddle webhooks
```

### Email (`email.slyxup.in`)
```
POST   /api/email/send             — Send email (Brevo)
```

### Analytics (`analytics.slyxup.in`)
```
POST   /api/analytics/event        — Track event
POST   /api/analytics/pageview     — Track page view
GET    /api/analytics/events       — List events
GET    /api/analytics/summary      — Dashboard summary
```

### Storage (`storage.slyxup.in`)
```
POST   /api/storage/upload         — Upload to R2
GET    /api/storage/download?key=  — Download from R2
GET    /api/storage/list           — List files
```

### Admin (`admin.slyxup.in`)
```
GET    /api/admin/dashboard        — Stats
GET    /api/admin/users            — List admin users
POST   /api/admin/users            — Create admin user
GET    /api/admin/audit-logs       — List audit logs
POST   /api/admin/audit-logs       — Create audit log
```

## Client SDK Usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const client = createSlyxupClient({
  apiKey: "sk-...",
  authBaseUrl: "https://auth.slyxup.in",
  billingBaseUrl: "https://billing.slyxup.in",
  // ... or use defaults
});

// Usage
const { jwt, user } = await client.auth.login({ email, password });
const plans = await client.billing.listPlans();
await client.email.send({ to: ["user@example.com"], subject: "Welcome", template: "welcome" });
```

## Deployment

Each service is deployed to its own Cloudflare account:

```bash
# Set appropriate CLOUDFLARE_API_TOKEN per account
pnpm --filter @slyxup/auth-service deploy       # Account #1
pnpm --filter @slyxup/billing-service deploy    # Account #2
pnpm --filter @slyxup/email-service deploy      # Account #3
pnpm --filter @slyxup/analytics-service deploy  # Account #4
pnpm --filter @slyxup/storage-service deploy    # Account #5
pnpm --filter @slyxup/admin-service deploy      # Account #6
```

### DNS
All services share the `slyxup.in` zone with CNAME records pointing to each Worker's `*.workers.dev` domain.

## Adding a New Product

1. Copy `products/_template/` to `products/{name}/`
2. Create `apps/api/` worker (Hono) for backend logic
3. Create `apps/web/` for the React frontend (Vite + Tailwind)
4. Import SDK: `import { createSlyxupClient } from "@slyxup/sdk"`
5. Deploy Worker and Pages to its own Cloudflare account

```ts
// products/{name}/apps/web/src/main.tsx
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ apiKey: import.meta.env.VITE_API_KEY });

// Now just business logic — auth, billing, email all handled by platform
```

## Scaling

- **Current**: Each service is an independent Worker in its own CF account, with per-service D1 schemas
- **Future**: If a service needs more resources, split it into a dedicated account with its own D1/R2
- **No shared infrastructure**: Every account has independent free quotas
