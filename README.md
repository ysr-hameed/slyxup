# Slyxup — Multi-Tenant SaaS Platform

Cloudflare Workers microservices (Auth, Payment, Admin) + React SPAs. Har platform ka apna frontend, shared backend infrastructure.

## Architecture

```
                    ┌─────────────────┐
                    │   Auth Service   │  ← JWT, OAuth, sessions
                    │   (shared)      │     users.platform = "app-x"
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
  │  Platform A  │  │  Platform B  │  │  Platform C  │
  │  app-a.com   │  │  app-b.com   │  │  app-c.com   │
  │              │  │              │  │              │
  │ auth call    │  │ auth call    │  │ auth call    │
  │ pricing A    │  │ pricing B    │  │ pricing C    │
  │ features     │  │ features     │  │ features     │
  └──────────────┘  └──────────────┘  └──────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                    ┌─────────────────┐
                    │  Payment Service│  ← plans.platform
                    │   (shared)      │     subs.platform
                    └────────┬────────┘
                             │
                    ┌─────────────────┐
                    │  Admin Service  │  ← super admin, audit, tests
                    │   (shared)      │
                    └─────────────────┘
```

Har **Platform** ek independent React SPA hai, apne subdomain par deploy (e.g. `app-a.com`, `app-b.com`). Backend services shared hain lekin multi-tenant — har record me `platform` field hai.

## Structure

```
slyxup.in/
├── packages/
│   ├── shared-types/     → User, Session, Subscription, Plan, ApiResponse, Env
│   ├── shared-utils/     → jwt.ts, crypto.ts, validation.ts
│   ├── shared-db/        → schema/ (auth.ts, payment.ts, admin.ts, test.ts), migrations/
│   ├── shared-logger/    → JSON logger, error handler
│   └── shared-email/     → Brevo API, email templates
│
├── services/
│   ├── auth/             → POST /register, /login, /verify, /logout, /google/**
│   ├── payment/          → POST /checkout, /webhook, /portal, GET /subscription
│   └── admin/            → POST /login, /test/auth, /test/payment, CRUD admins
│
├── apps/
│   ├── web/              → Main landing page (slyxup.in)
│   ├── main-web/         → slyxup.in (marketing, docs)
│   ├── auth-web/         → auth.slyxup.in (login, register pages)
│   ├── payment-web/      → payment.slyxup.in (pricing, checkout, portal)
│   └── admin-web/        → admin.slyxup.in (dashboard, tests, audit)
│
├── docs/                 → Future documentation per platform
├── postman.json          → API collection
├── AGENTS.md             → AI coding instructions
└── README.md
```

## Multi-Tenant Data Model

Har shared service me `platform` column hai:

### Auth DB (`slyxup-auth`)
| Table | Key Fields | Indexes |
|---|---|---|
| users | id, email, name, password_hash, **platform**, google_id, github_id, avatar_url | email, platform |
| sessions | id, user_id, token, expires_at | token, user_id |

### Payment DB (`slyxup-payment`)
| Table | Key Fields | Indexes |
|---|---|---|
| plans | id, name, description, amount, currency, interval, **platform**, paddle_price_id | platform |
| subscriptions | id, user_id, **platform**, plan_id, status, current_period_start/end, paddle_sub_id, paddle_cust_id | user_id, paddle_sub_id |
| invoices | id, subscription_id, user_id, **platform**, amount, currency, status, paddle_invoice_id | user_id |

### Admin DB (`slyxup-admin`)
| Table | Key Fields |
|---|---|
| admin_users | id, email, name, password_hash, role (superadmin, admin) |
| audit_logs | id, admin_id, action, resource, resource_id, details |
| test_results | id, test_name, endpoint, passed, response_status, response_body, error |

## Services

### Auth Service (independently deployable)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | — | Register user for a platform |
| POST | /api/auth/login | — | Login, returns JWT + session |
| GET | /api/auth/verify | JWT | Verify JWT validity |
| GET | /api/auth/me | JWT | Get current user profile |
| POST | /api/auth/logout | — | Delete session |
| GET | /api/auth/google/login | — | Google OAuth redirect |
| GET | /api/auth/google/callback | — | Google OAuth callback |

### Payment Service (independently deployable)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/payment/checkout | — | Create Paddle checkout |
| POST | /api/payment/webhook | Paddle sig | Handle Paddle events |
| GET | /api/payment/subscription | — | List subscriptions (query: userId, platform) |
| POST | /api/payment/portal | — | Create Paddle customer portal |

### Admin Service (independently deployable)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/admin/register | Secret | Create admin (first-time setup) |
| POST | /api/admin/login | — | Admin JWT login |
| GET | /api/admin/users | JWT | List all admins |
| GET | /api/admin/users/:id | JWT | Get admin by ID |
| DELETE | /api/admin/users/:id | JWT | Delete admin |
| GET | /api/admin/audit | JWT | View audit logs |
| POST | /api/admin/test/auth | JWT | Run integration tests vs Auth service |
| POST | /api/admin/test/payment | JWT | Run integration tests vs Payment service |
| GET | /api/admin/test/results | JWT | View saved test results |

## How to Add a New Platform

1. **Clone frontend template**
   ```bash
   cp -r apps/web apps/platform-x
   # Update .env, branding, features
   ```

2. **Register platform in shared DB**
   - Auth service: users register with `platform: "platform-x"`
   - Payment service: Create plans with `platform: "platform-x"`

3. **Deploy frontend to its own domain**
   ```bash
   pnpm deploy:platform-x  # Cloudflare Pages → platform-x.com
   ```

4. **API proxy** — Pages Functions `/api/[[path]].ts` routes requests to shared Workers

## Why Multi-Tenant Shared Services

| Approach | Cost | Maintenance | Data Isolation |
|---|---|---|---|
| **Shared services + platform field** ✅ | Ek hi Worker, ek hi DB per service | Update ek jagah | Row-level (platform filter) |
| Separate Workers per platform | Har platform ke alag Workers ($) | Multiple deploys | Complete isolation |

Chhoti-moti platforms ke liye shared services kaafi hain. Agar koi platform bahut bada ho jaye to usse alag Worker + DB me migrate karna easy hai — sirf platform filter change karna.

## Stack

| Layer | Tech | Why |
|---|---|---|
| Runtime | Cloudflare Workers | Free, 0ms cold start |
| Language | TypeScript 5.7+ | Strict mode |
| Framework | Hono 4.x | 12KB, Worker-native |
| ORM | Drizzle ORM + D1 | No query engine, type-safe |
| Auth | jose JWT (HS256) | Web Crypto API |
| Payment | Paddle Billing v2 | MoR — tax/VAT/GST handled |
| Frontend | React + Vite | shadcn/ui, SPA, no SSR |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first |
| Monorepo | pnpm workspaces | Fast, disk efficient |
| Deploy | wrangler 4.x | Workers + Pages |

## Why No SSR

Static SPA = CDN se direct serve, Workers sirf API ke liye.

| Approach | Worker req/day | Cost for 50k users |
|---|---|---|
| Static SPA ✅ | ~30k API calls | Free |
| SSR (Next.js) | ~100k pages | Limits hit fast |

## Commands

```bash
pnpm dev:auth         # Auth service → :8000
pnpm dev:payment      # Payment service → :8001
pnpm dev:admin        # Admin service → :8002
pnpm dev:web          # Main frontend → :5173

pnpm deploy:auth      # Deploy auth Worker
pnpm deploy:payment   # Deploy payment Worker
pnpm deploy:admin     # Deploy admin Worker
pnpm deploy:web       # Deploy frontend to Pages

pnpm db:create:auth   # Create auth D1
pnpm db:create:payment
pnpm db:create:admin  # Create admin D1
pnpm db:migrate:auth  # Apply auth migrations
pnpm db:migrate:payment
pnpm db:migrate:admin # Apply admin migrations
pnpm db:generate      # Generate Drizzle migrations

pnpm typecheck        # TypeScript check all packages
```

## Secrets

Each service has its own `.dev.vars` for local dev and `wrangler secret put` for production.

### Auth (`services/auth/.dev.vars`)
```
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
BREVO_API_KEY=...
EMAIL_FROM=...
ENVIRONMENT=development
```

### Payment (`services/payment/.dev.vars`)
```
PADDLE_API_KEY=...
PADDLE_WEBHOOK_SECRET=...
PADDLE_ENVIRONMENT=sandbox
ENVIRONMENT=development
```

### Admin (`services/admin/.dev.vars`)
```
JWT_SECRET=...
ADMIN_JWT_SECRET=...
ENVIRONMENT=development
```

## Free Tier Budget

| Resource | Limit | Our est. |
|---|---|---|
| Workers req/day | 100k | ~30k API calls |
| D1 rows read/day | 5M | ~200k |
| D1 storage | 5GB | ~500MB |
| Pages bandwidth | Unlimited | — |
| Pages builds/mo | 500 | ~20 |
