# Slyxup Platform

7 isolated Cloudflare Workers + 10 shared packages + SDK for building multi-tenant SaaS products. Everything runs on Cloudflare's edge — no servers, no containers, no ops.

```
auth.slyxup.online         → Auth
billing.slyxup.online      → Billing
email.slyxup.online        → Email
analytics.slyxup.online    → Analytics
storage.slyxup.online      → Storage
notification.slyxup.online → Notification
admin.slyxup.online        → Admin
api-url.slyxup.online      → URL Shortener API
url.slyxup.online          → URL Shortener Web (Pages)
```

---

## What is this? (high-level)

Slyxup is a **platform of platforms** — a set of reusable backend services that any SaaS product can use for common needs: auth, billing, email, analytics, file storage, notifications, and admin tooling.

Think of it like building your own Supabase or Firebase, but:
- Each service is **independent** (no monolith — deploy/auth/bill/scale separate)
- Runs on **Cloudflare Workers** (global edge, near-zero cold start, cheap)
- Accessed via **SDK** (one import to get all 7 services)
- **Multi-tenant by design** (a `platform` field on every record)

---

## Why 7 separate services?

### Isolation
Each service has its own:
- **Worker** (deploys independently, can scale differently)
- **Database** (no single DB bottleneck, different D1 databases)
- **Domain** (clear boundaries — auth bugs don't break billing)
- **Rate limits** (D1-backed, per-service — one service can't DoS another)

### Why not a monolith?
| Monolith | This approach |
|----------|--------------|
| Single deployment — auth bug breaks everything | Auth deploys at `auth.slyxup.online`, billing at `billing.slyxup.online` — they don't share processes |
| Single DB — analytics load slows down login | Analytics uses its own D1 instance — auth is never affected |
| One rate limit for everything | Each service has its own rate limit table and config |
| Hard to reason about | Each service is <500 lines of route handlers |
| One language lock-in | Could rewrite storage in Rust tomorrow — it only exposes HTTP |

### Not all services need a DB
- **Email** (Brevo API — no persistence needed)
- **Storage** (R2 — object storage, not a relational DB)

These are pure-proxy workers that transform API calls to their upstream.

---

## The 7 Services (detailed)

### 1. Auth Service (`auth.slyxup.online`, port 8000)

**What it does:** Register, login, logout, email verification, password reset, Google/GitHub OAuth, session management, account lockout.

**Why separate:** Authentication is the most security-critical piece. Isolating it means:
- A bug in analytics event tracking **cannot** leak auth tokens
- Rate limits are stricter (5 req/min on forgot-password vs 60 on other endpoints)
- Can rotate secrets (`JWT_SECRET`, `GOOGLE_CLIENT_SECRET`) without touching other services

**How other services use it:** URL shortener API verifies JWTs locally (no HTTP call per request). Admin service also verifies admin JWTs. Both share the same `JWT_SECRET`.

**Endpoints:**
```
POST /api/auth/register         → Create account + send verification email
POST /api/auth/login            → JWT (15min) + session token (30d)
POST /api/auth/logout           → Revoke current session
POST /api/auth/refresh          → Exchange session token for new JWT
POST /api/auth/logout-all       → Revoke all sessions
GET  /api/auth/me               → Get profile (requires JWT)
PATCH /api/auth/me              → Update name/avatar (requires JWT)
DELETE /api/auth/me             → Soft-delete account (requires JWT)
GET  /api/auth/verify?token=    → Verify email (no auth — public)
POST /api/auth/change-password  → Change password (requires JWT)
POST /api/auth/forgot-password  → Send reset email
POST /api/auth/reset-password   → Reset with token
POST /api/auth/resend-verification → Resend verification email
GET  /api/auth/google           → OAuth redirect
GET  /api/auth/google/callback  → OAuth callback
GET  /api/auth/github           → OAuth redirect
GET  /api/auth/github/callback  → OAuth callback
GET  /api/auth/sessions         → List active sessions (requires JWT)
DELETE /api/auth/sessions/:id   → Revoke specific session (requires JWT)
```

**Security features:**
- Password policy: 8+ chars, upper + lower + number
- Account lockout: 5 failed attempts = 15 min block
- JWT expiry: 15 minutes (short-lived, refresh via session)
- Email verification required before login
- Rate limiting: 20/min login, 10/min register, 5/min forgot-password
- D1-backed rate limits (persistent across Worker restarts)

---

### 2. Billing Service (`billing.slyxup.online`, port 8001)

**What it does:** Plans, Paddle checkouts, subscription management, invoice tracking, webhook handling.

**Why separate:** Payment data is sensitive. The billing service:
- Communicates with Paddle API (needs its own `PADDLE_API_KEY`)
- Handles webhooks signed with `PADDLE_WEBHOOK_SECRET` (fail-closed — rejects unsigned requests)
- Has its own subscription/invoice tables
- Isolated so a billing bug never affects authentication or analytics

**Environment:**
- `PADDLE_URL_MODE` = `"production"` → uses `checkout.paddle.com` / `portal.paddle.com`
- `PADDLE_URL_MODE` unset or anything else → uses `sandbox-checkout.paddle.com` / `sandbox-portal.paddle.com`

**Endpoints:**
```
GET  /api/billing/plans?platform= → List available plans
POST /api/billing/create-checkout → Create Paddle checkout URL
POST /api/billing/create-portal   → Create Paddle customer portal URL
GET  /api/billing/subscription?user_id= → Get user's subscription
POST /api/billing/webhook         → Paddle webhook (signature-verified)
```

---

### 3. Email Service (`email.slyxup.online`, port 8002)

**What it does:** Sends transactional emails via Brevo API.

**Why separate (no DB):** This is a thin proxy. Isolating it means:
- Auth service doesn't need Brevo API keys at all — just calls this service internally
- Can swap Brevo for SendGrid/SES/Resend by changing one Worker
- No DB = lowest possible latency

**Endpoints:**
```
POST /api/email/send  → Send email (requires X-API-Key)
```

---

### 4. Analytics Service (`analytics.slyxup.online`, port 8003)

**What it does:** Custom event tracking, page view tracking, summary stats.

**Why separate:** Analytics generates the most data volume. Isolating it means:
- High write throughput doesn't affect auth or billing
- Can use different D1 configuration (larger DB, different caching)
- Can change analytics implementation (e.g., switch to Tinybird/Clickhouse) without touching other services

**Endpoints:**
```
POST /api/analytics/event      → Track custom event (requires X-API-Key)
POST /api/analytics/pageview   → Track page view (requires X-API-Key)
GET  /api/analytics/events     → List events with pagination (requires X-API-Key)
GET  /api/analytics/summary    → Get summary stats (requires X-API-Key)
```

---

### 5. Storage Service (`storage.slyxup.online`, port 8004)

**What it does:** File upload/download/list/delete via Cloudflare R2.

**Why separate (no DB):** R2 is S3-compatible object storage. Isolating it means:
- Any product can upload/download without S3 credentials
- File validation (size limits, type checking) lives in one place
- Can add CDN caching, signed URLs, virus scanning — all in one Worker

**Endpoints:**
```
POST /api/storage/upload?key=    → Upload file (100MB limit, requires X-API-Key)
GET  /api/storage/download?key= → Download file (requires X-API-Key)
GET  /api/storage/list?prefix=  → List files with prefix filter (requires X-API-Key)
DELETE /api/storage/delete?key= → Delete file (requires X-API-Key)
```

---

### 6. Admin Service (`admin.slyxup.online`, port 8005)

**What it does:** Dashboard stats, user management, audit logging.

**Why separate:** Admin operations need elevated permissions (`X-Admin-Key`) but still need access to platform data. Isolating it means:
- Admin panel code never touches user-facing services
- Audit logs have their own table (can't be tampered with from user endpoints)
- Strict authentication with separate `ADMIN_KEY`

**Endpoints:**
```
GET  /api/admin/dashboard   → Dashboard stats (requires X-Admin-Key)
GET  /api/admin/users       → List users (requires X-Admin-Key)
POST /api/admin/users       → Create user (requires X-Admin-Key)
GET  /api/admin/audit-logs  → List audit logs (requires X-Admin-Key)
POST /api/admin/audit-logs  → Create audit log entry (requires X-Admin-Key)
```

---

### 7. Notification Service (`notification.slyxup.online`, port 8006)

**What it does:** Send and log notifications (email, SMS, push).

**Why separate:** Notifications are cross-cutting. Isolating it means:
- Notifications can be queued/retried without blocking the calling service
- All notification logs in one place (across all products)
- Can add new channels (SMS via Twilio, push via FCM) without touching other services

**Endpoints:**
```
POST /api/notification/send   → Send notification (email → forwards to email-service via HTTP, requires X-API-Key)
GET  /api/notification/logs   → List notification logs with pagination (requires X-API-Key)
```

---

## The 8 Shared Packages

| Package | What it provides | Used by |
|---------|------------------|---------|
| `@slyxup/shared` | Zod schemas, JWT sign/verify, password hash/verify, crypto (`generateId`, `generateToken`), CORS config, API response format, rate limit middleware (both in-memory and D1-backed), OpenAPI setup helpers | All services + SDK |
| `@slyxup/logger` | Structured JSON logger (`logger.info/warn/error/debug`), `createHonoErrorHandler()` that logs + returns 500 | All services |
| `@slyxup/auth-client` | HTTP client for auth service (`login`, `register`, `verifyEmail`, etc.) | SDK, products |
| `@slyxup/billing-client` | HTTP client for billing service (`listPlans`, `getSubscription`, etc.) | SDK, products |
| `@slyxup/email-client` | HTTP client for email service (`send`) | SDK, notification service |
| `@slyxup/analytics-client` | HTTP client for analytics service (`trackEvent`, `trackPageView`, etc.) | SDK, products |
| `@slyxup/storage-client` | HTTP client for storage service (`upload`, `list`, `getDownloadUrl`) | SDK, products |
| `@slyxup/admin-client` | HTTP client for admin service (`listUsers`, `createAuditLog`, etc.) | SDK, admin tools |
| `@slyxup/notification-client` | HTTP client for notification service (`send`, `listLogs`) | SDK, products |
| `@slyxup/sdk` | Unified `createSlyxupClient()` that wraps all 7 clients in one import | Products |

All packages use `workspace:*` protocol internally. `pnpm publish` auto-converts to version ranges.

---

## How to use the SDK

```ts
import { createSlyxupClient } from "@slyxup/sdk";

// In a product (like URL shortener), provide base URLs for services it needs:
const api = createSlyxupClient({
  authBaseUrl: "https://auth.slyxup.online",
  billingBaseUrl: "https://billing.slyxup.online",
  apiKey: "sk-...", // optional — needed for service-to-service calls
});

// Auth
const { jwt, user } = await api.auth.login({ email, password, platform: "url-shortener" });
await api.auth.register({ email, password, name, platform: "url-shortener" });
await api.auth.verifyEmail(token);
const profile = await api.auth.me(jwt);

// Billing
const plans = await api.billing.listPlans("url-shortener");
const sub = await api.billing.getSubscription(userId);
const { url } = await api.billing.createCheckout({ plan_id, user_id, platform, success_url, cancel_url });

// Analytics
await api.analytics.trackEvent({ name: "signup", platform: "url-shortener", user_id });
await api.analytics.trackPageView({ path: "/dashboard", platform: "url-shortener" });

// Storage (upload from browser)
const { key, url } = await api.storage.upload(file);
// Storage (get download URL for existing file)
const downloadUrl = api.storage.getDownloadUrl(key);
// Storage (list files)
const files = await api.storage.list("uploads/");

// Notification
await api.notification.send({
  user_id, channel: "email", to_address: "user@example.com",
  subject: "Welcome!", body: "<h1>Hello</h1>",
});
```

---

## Service-to-service auth

| Header | When to use | Example |
|--------|------------|---------|
| `Authorization: Bearer <jwt>` | End-user requests (products → auth, products → url-shortener API) | `curl -H "Authorization: Bearer eyJ..."` |
| `X-API-Key` | Service-to-service (auth → email, notification → email) | `fetch(url, { headers: { "X-API-Key": "sk-..." } })` |
| `X-Admin-Key` | Admin panel → admin service | Separate from `API_KEY` for isolation |

---

## Architecture patterns

### Each service is independently deployable
```bash
pnpm --filter @slyxup/auth-service deploy  # Deploys only the auth worker
pnpm --filter @slyxup/billing-service deploy  # Deploys only billing
# They don't depend on each other at deploy time
```

### D1-backed rate limiting
All services with a database use `d1RateLimit()` from `@slyxup/shared/middleware.ts`:
- Creates a `rate_limits` table with composite PK `(ip, route, window_start)`
- Atomic upsert via `INSERT ... ON CONFLICT DO UPDATE`
- Falls back to in-memory map if no D1 binding (email, storage)
- Sets `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers

### Local JWT verification
The URL shortener API verifies JWTs **without calling the auth service**:
```ts
import { verifyToken } from "@slyxup/shared";
const payload = await verifyToken(token, c.env.JWT_SECRET);
// payload = { sub: "user-id", email: "...", platform_id: "...", exp, iat }
```
This eliminates the HTTP roundtrip on every API request.

### Multi-tenant by default
Every table has a `platform` column (or `platform_id`). A product like "URL Shortener" passes `platform: "url-shortener"` on registration, analytics, billing, and storage. The UI only shows data for its platform.

---

## Product architecture (URL Shortener example)

```
products/url-shortener/
├── apps/
│   ├── api/          → Cloudflare Worker, Hono, D1, local JWT verify
│   │   POST /api/url     Create short URL (auth required, checks plan limits)
│   │   GET  /api/url     List user's URLs (auth required, paginated)
│   │   DELETE /api/url/:id  Delete URL (auth required)
│   │   GET  /:slug       Redirect to original URL (public, tracks pageview)
│   └── web/          → React + Vite + Tailwind v4 SPA
│       - Manual routing (no react-router)
│       - Pages: Landing, AuthPage, Dashboard, Billing, Settings, VerifyEmail
│       - SDK calls go directly to platform services (auth.slyxup.online, etc.)
│       - public/_routes.json for SPA fallback on Cloudflare Pages
```

### Plan limits enforced per-product
| Plan | URLs | Slugs | Expiry |
|------|------|-------|--------|
| Free | 10 | 6-char auto | 30 days |
| Pro | 1,000 | Custom (4-12 chars) | No expiry |

The API checks `billing.getSubscription()` locally (via SDK) before creating URLs.

---

## Database schemas

### Auth (D1: `slyxup-auth`)
`users`, `sessions`, `oauth_accounts`, `platforms`, `platform_memberships`, `rate_limits`, `audit_logs`, `oauth_states`

### Billing (D1: `slyxup-billing`)
`plans`, `subscriptions`, `invoices`, `rate_limits`

### Analytics (D1: `slyxup-analytics`)
`events`, `page_views`, `rate_limits`

### Admin (D1: `slyxup-admin`)
`admin_users`, `audit_logs`, `rate_limits`

### Notification (D1: `slyxup-notification`)
`notification_templates`, `notification_logs`, `rate_limits`

### Email
No DB — proxy to Brevo API.

### Storage
No DB — wraps R2 (Cloudflare's S3-compatible object storage).

---

## Development

```bash
pnpm install

# Start services individually:
pnpm --filter @slyxup/auth-service dev         # port 8000
pnpm --filter @slyxup/billing-service dev      # port 8001
pnpm --filter @slyxup/email-service dev        # port 8002
pnpm --filter @slyxup/analytics-service dev    # port 8003
pnpm --filter @slyxup/storage-service dev      # port 8004
pnpm --filter @slyxup/admin-service dev        # port 8005
pnpm --filter @slyxup/notification-service dev # port 8006
pnpm --filter @slyxup/url-shortener dev:api    # port 9000
pnpm --filter @slyxup/url-shortener-web dev    # port 5173

# Or use start.sh for convenience:
./start.sh start core    # All 7 platform services
./start.sh start product # URL shortener (api + web)
./start.sh start all     # Everything
```

### Local verification flow
Since email service is only in production, verification links are logged:
```
{"level":"info","message":"dev_verification_link","verifyLink":"http://localhost:5173/verify-email?token=..."}
```
Open that link in your browser. Requires `APP_DOMAIN=http://localhost:5173` in `platform/auth-service/.dev.vars`.

### Apply DB migrations
```bash
pnpm --filter @slyxup/<service> exec wrangler d1 migrations apply slyxup-<db> --local
```
For URL shortener API:
```bash
pnpm --filter @slyxup/url-shortener exec wrangler d1 migrations apply slyxup-url-shortener --local --config apps/api/wrangler.jsonc
```

---

## Deployment

```bash
# 1. Set secrets on each worker
echo -n "your-jwt-secret" | wrangler secret put JWT_SECRET --name slyxup-auth
echo -n "your-api-key" | wrangler secret put API_KEY --name slyxup-email
# ... etc for each service

# 2. Apply production DB migrations
pnpm --filter @slyxup/auth-service exec wrangler d1 migrations apply slyxup-auth --remote

# 3. Deploy
pnpm --filter @slyxup/auth-service deploy
pnpm --filter @slyxup/billing-service deploy
pnpm --filter @slyxup/email-service deploy
pnpm --filter @slyxup/analytics-service deploy
pnpm --filter @slyxup/storage-service deploy
pnpm --filter @slyxup/admin-service deploy
pnpm --filter @slyxup/notification-service deploy
pnpm --filter @slyxup/url-shortener deploy:api
pnpm --filter @slyxup/url-shortener deploy:web
```

### CI (GitHub Actions)
Pushing to `main` triggers:
1. Deploy all 7 platform Services (sequential — each can fail independently)
2. Deploy URL Shortener API Worker
3. Deploy URL Shortener Web (Cloudflare Pages)

Check: https://github.com/ysr-hameed/slyxup/actions

---

## Key conventions

- **API response format**: `{ success: true, data: {...} }` or `{ success: false, error: "..." }`
- **Auth**: `Authorization: Bearer <jwt>` for users, `X-API-Key` for services, `X-Admin-Key` for admin
- **Error handling**: All services use `createHonoErrorHandler()` from `@slyxup/logger`
- **Logging**: Structured JSON via `@slyxup/logger` — every request logged with method, path, status, duration
- **Rate limiting**: D1-backed (atomic upsert, composite PK on ip+route+window), falls back to in-memory for services without DB
- **Workspace protocol**: All `@slyxup/*` deps use `workspace:*`; `pnpm publish` auto-converts to version ranges
