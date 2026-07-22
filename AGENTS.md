# AGENTS.md — Slyxup

## Stack
- **Runtime**: Cloudflare Workers (free)
- **Language**: TypeScript 5.7+ strict
- **Web**: Hono 4.x
- **ORM**: Drizzle ORM (d1 adapter, no Prisma!)
- **DB**: Cloudflare D1 (SQLite)
- **Auth**: jose JWT (HS256)
- **Payment**: Paddle Billing v2 (NOT Stripe)
- **Frontend**: React + Vite + shadcn/ui + Tailwind (SPA, NO SSR)
- **Hosting**: Cloudflare Pages + Functions
- **Monorepo**: pnpm workspaces
- **Deploy**: wrangler 4.x

## Structure
```
packages/
├── shared-types/     → User, Session, Subscription, ApiResponse, Env types
├── shared-utils/     → jwt.ts, crypto.ts, validation.ts
└── shared-db/        → schema/ (auth.ts, payment.ts), migrations/

services/
├── auth/             → Hono app, routes/ (register, login, verify, logout)
└── payment/          → Hono app, routes/ (checkout, webhook, subscription, portal)

apps/
└── web/              → React SPA (no SSR), components/, routes/, lib/, functions/api/
```

## Key Rules
- ALWAYS use Drizzle ORM — never raw SQL
- ALWAYS import from workspace packages (`@slyxup/*`)
- NEVER use bcrypt — use Web Crypto API SHA-256
- NEVER use Stripe — use Paddle Billing v2
- NEVER hardcode secrets — use `wrangler secret put`
- ALWAYS verify Paddle webhook signatures (paddle-signature header)
- Webhook handlers MUST be idempotent (store eventId)
- Passwords hashed with Web Crypto API (SHA-256)
- Each service has its own D1 database
- Frontend is STATIC React SPA — no SSR (keeps Workers free)
- Use shadcn/ui for UI components

## Paddle Rules
- Paddle is MoR — NEVER calculate VAT/tax manually
- Checkout via hosted overlay, NEVER direct card charges
- Sandbox & production are completely separate environments
- Use `@paddle/paddle-node-sdk` on server
- Use `@paddle/paddle-js` on frontend

## Commands
```bash
pnpm dev:auth              # Dev auth service
pnpm dev:payment           # Dev payment service
pnpm dev:web               # Dev frontend (React Vite)
pnpm deploy:auth           # Deploy auth worker
pnpm deploy:payment        # Deploy payment worker
pnpm deploy:web            # Deploy frontend to Pages
pnpm db:create:auth        # Create auth D1 database
pnpm db:create:payment     # Create payment D1 database
pnpm db:generate           # Generate Drizzle migrations
pnpm db:migrate:auth       # Apply auth migrations
pnpm db:migrate:payment    # Apply payment migrations
pnpm typecheck             # TypeScript check
pnpm format                # Format code
```

## Package Names
- `@slyxup/shared-types`
- `@slyxup/shared-utils`
- `@slyxup/shared-db`
- `@slyxup/auth`
- `@slyxup/payment`
- `@slyxup/web` (not used — frontend deploys via Cloudflare Pages, not Workers)

## Types
```
Bindings for Workers:
  AuthEnv { DB: D1Database, JWT_SECRET: string }
  PaymentEnv { DB: D1Database, PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET, PADDLE_ENV }
```

## Drizzle ORM
- Import: `drizzle-orm/d1`
- Runtime: `drizzle(env.DB, { schema })`
- Config: `drizzle.config.ts` with `driver: "d1-http"`
- Generate: `drizzle-kit generate`
- Apply: `wrangler d1 migrations apply DB --local/--remote`
