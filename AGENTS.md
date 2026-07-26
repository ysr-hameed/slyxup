# Slyxup Platform Architecture

All services in one Cloudflare account (`ed01399ae5f7a46697e0802e4eaef6a9`). Each deploys independently.

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

## Structure

```
├── packages/
│   ├── shared/          → Types, JWT, crypto, Zod, OpenAPI, rate limiting, CORS
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
│   ├── auth-service/        → Auth Worker (Hono + OpenAPI, D1)
│   ├── billing-service/     → Billing Worker (Paddle, D1)
│   ├── email-service/       → Email Worker (Brevo API, no DB)
│   ├── analytics-service/   → Analytics Worker (D1)
│   ├── storage-service/     → Storage Worker (R2, no DB)
│   ├── notification-service/→ Notification Worker (D1)
│   └── admin-service/       → Admin API Worker (D1)
│
├── products/
│   └── url-shortener/
│       ├── apps/api/        → URL Shortener API Worker (Hono, D1)
│       └── apps/web/        → URL Shortener frontend (React + Vite + Tailwind)
```

## Local vs Production URL resolution

All internal packages use `workspace:*` protocol. Frontend URLs are centralized in `config.ts`:

```ts
// products/url-shortener/apps/web/src/config.ts
const AUTH_BASE = import.meta.env.DEV ? "http://localhost:8000" : "https://auth.slyxup.online";
const BILLING_BASE = import.meta.env.DEV ? "http://localhost:8001" : "https://billing.slyxup.online";
const API_BASE = import.meta.env.DEV ? "http://localhost:9000" : "https://api-url.slyxup.online";
```

`pnpm publish` auto-converts `workspace:*` to version ranges in the published tarball.

## Auth service endpoints (port 8000)

```
POST /api/auth/register            → Register (verification token emailed)
POST /api/auth/login               → Login (JWT 15min, session 30d)
POST /api/auth/logout              → Revoke current session
POST /api/auth/refresh             → Exchange session token for new JWT
POST /api/auth/logout-all          → Revoke all sessions
GET  /api/auth/me                  → Get profile
PATCH /api/auth/me                 → Update profile (name, avatar)
DELETE /api/auth/me                → Soft-delete account
GET  /api/auth/verify?token=       → Verify email
POST /api/auth/change-password     → Change password
POST /api/auth/forgot-password     → Send reset email (generic response)
POST /api/auth/reset-password      → Reset with token
POST /api/auth/resend-verification → Resend verification email
GET  /api/auth/google              → Google OAuth redirect
GET  /api/auth/google/callback     → Google OAuth callback
GET  /api/auth/github              → GitHub OAuth redirect
GET  /api/auth/github/callback     → GitHub OAuth callback
GET  /api/auth/sessions            → List active sessions
DELETE /api/auth/sessions/:id      → Revoke specific session
```

Security features: password regex (upper+lower+number, min 8), account lockout (5 fails = 15min), JWT 15min expiry, rate limiting (60 req/min per IP), email verification required for login.

## Billing (port 8001)
```
GET  /api/billing/plans            → List plans
POST /api/billing/create-checkout  → Create Paddle checkout
POST /api/billing/create-portal    → Create Paddle customer portal
GET  /api/billing/subscription     → Get subscription
POST /api/billing/webhook          → Paddle webhook
```

## Email (port 8002)
```
POST /api/email/send               → Send via Brevo (requires API key)
```

## Analytics (port 8003)
```
POST /api/analytics/event          → Track event
POST /api/analytics/pageview       → Track page view
GET  /api/analytics/events         → List events
GET  /api/analytics/summary        → Get summary
```

## Storage (port 8004)
```
POST /api/storage/upload           → Upload to R2
GET  /api/storage/download?key=    → Download from R2
GET  /api/storage/list             → List files
```

## Admin (port 8005)
```
GET  /api/admin/dashboard          → Dashboard stats
GET  /api/admin/users              → List users
POST /api/admin/users              → Create user
GET  /api/admin/audit-logs         → List audit logs
POST /api/admin/audit-logs         → Create audit log
```

## Notification (port 8006)
```
POST /api/notification/send        → Send notification
GET  /api/notification/logs        → List notification logs
```

## URL Shortener API (port 9000)
```
POST /api/url                      → Create short URL (auth required)
GET  /api/url                      → List user's URLs (auth required, paginated)
DELETE /api/url/:id                 → Delete a URL (auth required)
GET  /:slug                        → Redirect to original URL (public)

Plan limits: Free = 10 URLs, 6-char slugs, 30-day expiry; Pro = 1000 URLs, custom slugs, no expiry
JWT verified locally via shared `verifyToken()` — no auth service call per request

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

# Typecheck
pnpm typecheck

# Run tests
pnpm test
pnpm test:watch

# DB migrations (local)
pnpm --filter @slyxup/auth-service exec wrangler d1 migrations apply slyxup-auth --local
pnpm --filter @slyxup/billing-service exec wrangler d1 migrations apply slyxup-billing --local
pnpm --filter @slyxup/analytics-service exec wrangler d1 migrations apply slyxup-analytics --local
pnpm --filter @slyxup/admin-service exec wrangler d1 migrations apply slyxup-admin --local
pnpm --filter @slyxup/notification-service exec wrangler d1 migrations apply slyxup-notification --local

# Deploy individual services
pnpm --filter @slyxup/auth-service deploy
pnpm --filter @slyxup/billing-service deploy
# ... etc

# Publish packages to npm
pnpm --filter @slyxup/shared publish
pnpm --filter @slyxup/logger publish
pnpm --filter @slyxup/auth-client publish
# ... etc (SDK last)
```

## Key conventions

1. **API response format**: `{ success: true, data: {...} }` or `{ success: false, error: "..." }`
2. **Auth**: `Authorization: Bearer <jwt>` for users, `X-API-Key` for services, `X-Admin-Key` for admin
3. **Error handling**: All services use `createHonoErrorHandler()` from `@slyxup/logger`
4. **Logging**: Structured JSON via `@slyxup/logger` — every request logged with method, path, status, duration
5. **Rate limiting**: 60 requests/min per IP via `applyDefaultRateLimit` middleware from `@slyxup/shared`
6. **Workspace protocol**: All `@slyxup/*` dependencies use `workspace:*` locally; `pnpm publish` auto-converts to version ranges

## SDK usage

```ts
import { createSlyxupClient } from "@slyxup/sdk";

const api = createSlyxupClient({ apiKey: "sk-..." });
await api.auth.login({ email, password });
await api.billing.listPlans();
await api.storage.upload(file);
await api.notification.send({ ... });
```

## Frontend routing

No react-router. Manual routing via `window.location.pathname` + `pushState`:

```
/                  → AuthPage (login/signup)
/verify-email      → VerifyEmail
/forgot-password   → ForgotPassword
/reset-password    → ResetPassword
/dashboard         → Dashboard (default authenticated)
/billing           → Billing
/settings          → Settings (profile, password, sessions, delete)
```

## Tests

Vitest workspace at root. Run `pnpm test` for 20+ tests covering shared package (crypto, validation, JWT).

## Deployment workflow

After pushing to `main`, check GitHub Actions status:
- Open https://github.com/ysr-hameed/slyxup/actions
- Verify all deploy jobs pass (auth, billing, email, analytics, storage, admin, notification, api, web)
- If a deploy fails, check the logs — common issues: missing secrets, DB migration not applied, wrangler config mismatch
- Fix the issue and push again (no need to revert)

## DB schema changes

When adding/modifying columns or tables in any service that uses D1:

1. Edit the schema file in `src/schema/` (e.g. `platform/auth-service/src/schema/users.ts`)
2. Generate migration file:
   ```bash
   pnpm --filter @slyxup/auth-service exec drizzle-kit generate
   ```
   (replace `auth-service` with the correct package name)
3. Apply locally:
   ```bash
   pnpm --filter @slyxup/auth-service exec wrangler d1 migrations apply slyxup-auth --local
   ```
4. Verify locally by running the service and testing the affected endpoints
5. Apply to production:
   ```bash
   pnpm --filter @slyxup/auth-service exec wrangler d1 migrations apply slyxup-auth --remote
   ```
6. Deploy the service:
   ```bash
   pnpm --filter @slyxup/auth-service deploy
   ```

For the URL shortener API (which has no package.json, uses product-level deps):
```bash
pnpm --filter @slyxup/url-shortener exec wrangler d1 migrations apply slyxup-url-shortener --local --config apps/api/wrangler.jsonc
pnpm --filter @slyxup/url-shortener exec wrangler d1 migrations apply slyxup-url-shortener --remote --config apps/api/wrangler.jsonc
```

## Updating README

When any of these change, update the corresponding README:
- Adding/removing/renaming packages or services
- Changing API endpoints
- Adding new features visible to end users
- Changing deployment flow or environment variables

README files are in `packages/*/README.md`, `platform/*/README.md`, and `products/url-shortener/README.md`.

## Shared secrets

All services that verify JWTs must share the same `JWT_SECRET`:
- **auth-service**: signs and verifies JWTs
- **admin-service**: verifies admin JWTs
- **url-shortener API**: verifies user JWTs locally (instead of calling auth-service on every request)

Set `JWT_SECRET` via `wrangler secret put JWT_SECRET` in each worker that needs it.
For local dev, add it to each service's `.dev.vars`.

The deploy workflow (`deploy.yml`) automatically sets `JWT_SECRET` for the URL shortener API
during CI (requires `JWT_SECRET` GitHub secret to be set).

## Local development tips

### Email/password flow locally
Since the email service is only available in production, verification/reset links are
logged to the server console in development mode. After registering, check the auth service
logs for a line like:
```json
{"level":"info","message":"dev_verification_link","verifyLink":"http://localhost:5173/verify?token=..."}
```
Open that link in your browser to verify the email.

For password reset, the reset link is logged similarly as `dev_reset_link`.

### Missing DB tables locally
If a service returns `D1_ERROR: no such table`, apply its migrations:
```bash
pnpm --filter @slyxup/<service-name> exec wrangler d1 migrations apply slyxup-<db-name> --local
```
For the URL shortener API (uses product-level wrangler config):
```bash
pnpm --filter @slyxup/url-shortener exec wrangler d1 migrations apply slyxup-url-shortener --local --config apps/api/wrangler.jsonc
```

### Checking deployment health after push
After pushing to main, always verify:
1. https://github.com/ysr-hameed/slyxup/actions — all jobs should pass
2. If "Deploy Platform Services" fails on `deploy-url-shortener`, check:
   - `CF_API_TOKEN` has **Pages:Write** permission (regenerate in Cloudflare dashboard if needed)
   - `JWT_SECRET` is set as a GitHub secret for the CI step
   - The Pages project `slyxup-url-shortener-web` exists (`npx wrangler pages project list`)
3. If any platform service fails, check:
   - Missing secrets (`wrangler secret list --name <worker-name>`)
   - DB migrations not applied (`wrangler d1 migrations apply <db-name> --remote`)
