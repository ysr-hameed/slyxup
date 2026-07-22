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

task.slyxup.in      → Account #7 (Customer App)
crm.slyxup.in       → Account #8 (Customer App)
forms.slyxup.in     → Account #9 (Customer App)
```

## Monorepo Structure

```
├── packages/
│   ├── shared/           → Types, JWT, crypto, Zod validation, OpenAPI helpers
│   ├── database/         → Drizzle ORM schema + D1 client factories
│   ├── logger/           → Structured JSON logger
│   ├── sdk/              → Unified client wrapping all services
│   ├── auth-client/      → Auth service HTTP client
│   ├── billing-client/   → Billing service HTTP client
│   ├── email-client/     → Email service HTTP client
│   ├── analytics-client/ → Analytics service HTTP client
│   ├── storage-client/   → Storage service HTTP client
│   └── ui/               → Shared React components (Tailwind v4)
│
├── services/
│   ├── auth/             → Auth Worker (Hono + OpenAPI)
│   ├── billing/          → Billing Worker (Paddle integration)
│   ├── email/            → Email Worker (Resend)
│   ├── analytics/        → Analytics Worker (D1)
│   ├── storage/          → Storage Worker (R2)
│   └── admin/            → Admin API Worker (D1)
│
├── apps/
│   ├── admin/            → Admin React SPA (Vite + Tailwind)
│   ├── task/             → Task management app (template)
│   ├── crm/              → CRM app (template)
│   └── forms/            → Form builder app (template)
```

## Tech Stack

- **Runtime**: Cloudflare Workers (ES modules)
- **API Framework**: Hono + @hono/zod-openapi
- **Database**: D1 + Drizzle ORM (SQLite)
- **Auth**: JWT (HS256) + Session tokens + Google OAuth
- **Payments**: Paddle (adapter pattern for Stripe/Razorpay)
- **Email**: Resend API
- **Storage**: R2 (S3-compatible)
- **Frontend**: React 19 + Vite + Tailwind v4
- **Package Manager**: pnpm workspaces
- **Language**: TypeScript (strict mode)

## Service Patterns

Every service follows the same pattern:

```
services/{name}/
├── src/
│   ├── index.ts          → OpenAPIHono app, CORS, middlewares
│   ├── routes/           → Route handlers (one file per resource)
│   └── middleware/       → Auth, validation, rate-limit
├── migrations/           → D1 SQL migration files
├── wrangler.jsonc        → Worker configuration
├── .dev.vars.example     → Local env template
├── package.json          → Dependencies
└── tsconfig.json         → TypeScript config
```

## Key Conventions

### 1. Import Pattern
```ts
import { auth } from "@slyxup/auth-client";
import { billing } from "@slyxup/billing-client";
import { email } from "@slyxup/email-client";
```

### 2. API Response Format
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "message" }
```

### 3. Authentication
- **Service-to-service**: `X-API-Key` header
- **User-to-service**: `Authorization: Bearer <jwt>` header
- **Admin**: `X-Admin-Key` header or JWT

### 4. Error Handling
All services use `createHonoErrorHandler()` from `@slyxup/logger`.

### 5. Logging
Structured JSON logging via `@slyxup/logger`. Every request is logged with method, path, status, and duration.

## Database (D1)

Each service has its own D1 database:

| Service    | Tables                          |
|------------|---------------------------------|
| Auth       | users, sessions, oauth_accounts, platforms, platform_memberships |
| Billing    | plans, subscriptions, invoices  |
| Analytics  | events, page_views              |
| Admin      | admin_users, audit_logs         |

Migrations: `pnpm db:migrate:{service}`

## Development

```bash
# Install
pnpm install

# Run all services in parallel
pnpm dev:auth       # port 8000
pnpm dev:billing    # port 8001
pnpm dev:email      # port 8002
pnpm dev:analytics  # port 8003
pnpm dev:storage    # port 8004
pnpm dev:admin      # port 8005

# DB migrations (local)
pnpm db:migrate:auth
pnpm db:migrate:billing
pnpm db:migrate:analytics
pnpm db:migrate:admin
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
POST   /api/email/send             — Send email (Resend)
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
GET    /api/storage/download/:key  — Download from R2
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
pnpm deploy:auth       # Account #1
pnpm deploy:billing    # Account #2
pnpm deploy:email      # Account #3
pnpm deploy:analytics  # Account #4
pnpm deploy:storage    # Account #5
pnpm deploy:admin      # Account #6
```

### DNS
All services share the `slyxup.in` zone with CNAME records pointing to each Worker's `*.workers.dev` domain.

## Adding a New App

1. Create `apps/{name}/` with React + Vite + Tailwind
2. Import SDK: `import { createSlyxupClient } from "@slyxup/sdk"`
3. Add scripts to root `package.json`
4. Deploy to its own Cloudflare account

```ts
// apps/task/src/main.tsx
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ apiKey: import.meta.env.VITE_API_KEY });

// Now just business logic — auth, billing, email all handled by platform
```

## Scaling

- **Current**: Each service is an independent Worker in its own CF account
- **Future**: If a service needs more resources, split it into a dedicated account with its own D1/R2
- **No shared infrastructure**: Every account has independent free quotas
