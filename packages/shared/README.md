# @slyxup/shared

Shared utilities, TypeScript types, Zod validation schemas, JWT helpers, crypto functions, OpenAPI setup, rate limiting, CORS, and auth middlewares. Used by all Slyxup platform services.

## Installation

```bash
npm install @slyxup/shared
```

## Modules

### Types — `import type { ... } from "@slyxup/shared"`

TypeScript interfaces for all platform entities:

| Interface | Fields | Description |
|-----------|--------|-------------|
| `User` | id, email, name, password_hash, google_id, github_id, avatar_url, blocked, deleted_at, created_at, updated_at | Full user record |
| `Session` | id, user_id, token, ip, user_agent, last_seen, revoked_at, expires_at, created_at | Auth session |
| `Platform` | id, slug, name, domain, status, created_at | Multi-tenant platform |
| `PlatformMembership` | id, user_id, platform_id, role, created_at | User-platform link |
| `Plan` | id, name, description, platform, amount, currency, interval, paddle_price_id, deleted_at, created_at | Billing plan |
| `Subscription` | id, user_id, plan_id, platform, status, current_period_start, current_period_end, paddle_subscription_id, paddle_customer_id, deleted_at, created_at, updated_at | User subscription |
| `Invoice` | id, subscription_id, user_id, platform, amount, currency, status, paddle_invoice_id, deleted_at, created_at | Billing invoice |
| `AuditLog` | id, admin_id, action, resource, resource_id, details, ip, created_at | Admin audit trail |
| `AnalyticsEvent` | id, name, user_id, platform, properties, created_at | Custom analytics event |
| `PageView` | id, path, user_id, platform, referrer, user_agent, ip, created_at | Page view record |
| `FileRecord` | id, key, original_name, size, mime_type, user_id, platform, created_at | R2 file metadata |
| `JwtPayload` | sub, email, platform_id, exp, iat | JWT payload shape |
| `ApiResponse<T>` | success, data?, error? | Standard API response wrapper |

**Worker Env interfaces** — type-safe Cloudflare Worker binding types for each service:

| Interface | Service | Required bindings |
|-----------|---------|-------------------|
| `AuthEnv` | auth | DB, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET, GITHUB_CLIENT_ID/SECRET, API_KEY, EMAIL_SERVICE_URL, APP_DOMAIN, ENVIRONMENT |
| `BillingEnv` | billing | DB, PADDLE_API_KEY, PADDLE_WEBHOOK_SECRET, API_KEY, ENVIRONMENT |
| `EmailEnv` | email | BREVO_API_KEY, FROM_EMAIL, SUPPORT_EMAIL, API_KEY, ENVIRONMENT |
| `AnalyticsEnv` | analytics | DB, API_KEY, ENVIRONMENT |
| `StorageEnv` | storage | R2, R2_PUBLIC_URL, API_KEY, ENVIRONMENT |
| `NotificationEnv` | notification | DB, API_KEY, ENVIRONMENT |
| `AdminEnv` | admin | DB, JWT_SECRET, ADMIN_KEY, ENVIRONMENT |

Usage in a Worker:
```ts
import type { AuthEnv } from "@slyxup/shared";

export default { async fetch(request, env: AuthEnv, ctx) { ... } };
```

---

### Validation (Zod) — `import { ... } from "@slyxup/shared"`

| Export | Type | Description |
|--------|------|-------------|
| `emailSchema` | `z.string().email().max(255)` | Email validation |
| `passwordSchema` | `z.string().min(8).max(128).regex(...)` | 8+ chars, upper+lower+number |
| `loginSchema` | `{ email, password, platform? }` | Login payload |
| `registerSchema` | `{ email, password, name?, platform? }` | Registration payload |
| `sendEmailSchema` | `{ to, subject, html?, text?, template?, data? }` | Email send payload |
| `createCheckoutSchema` | `{ plan_id, user_id, platform, success_url, cancel_url }` | Paddle checkout |
| `trackEventSchema` | `{ name, platform, user_id?, properties? }` | Analytics event |
| `uploadFileSchema` | `{ key, user_id?, platform }` | File upload metadata |
| `apiResponseSchema(T)` | `{ success, data?, error? }` | Generic API response wrapper |

```ts
import { loginSchema, registerSchema, emailSchema, passwordSchema, apiResponseSchema } from "@slyxup/shared";

const input = loginSchema.parse({ email: "user@example.com", password: "Str0ng!" });
```

---

### Crypto — `import { hashPassword, verifyPassword, generateToken, generateId } from "@slyxup/shared"`

PBKDF2 with 100,000 iterations and SHA-256. Salt is 16 random bytes, stored alongside the hash.

```ts
const hash = await hashPassword("Str0ng!");    // "a1b2...:c3d4..." (salt:hash)
const ok = await verifyPassword("Str0ng!", hash); // boolean
const token = generateToken(); // 64-char hex (32 random bytes)
const id = generateId();       // 32-char hex (16 random bytes)
```

`generateToken` is used for session tokens, email verification tokens, and password reset tokens.
`generateId` is used for database record IDs.

---

### JWT — `import { signToken, verifyToken } from "@slyxup/shared"`

Custom HMAC-SHA256 JWT implementation with no external dependencies.

```ts
const jwt = await signToken(
  { sub: userId, email: "user@example.com", platform_id: "" },
  secret,            // same secret used across auth, admin, url-shortener
  900,               // TTL in seconds (15 min for access tokens)
);

const payload = await verifyToken(jwt, secret);
// → JwtPayload | null (null if expired, tampered, or invalid)
```

The `verifyToken` function:
- Splits the token into header.payload.signature
- Re-computes the HMAC-SHA256 signature and compares
- Checks `exp` against current time
- Returns decoded payload or `null`

Used by auth-service (sign + verify), admin-service (verify), and url-shortener API (local verify, no auth service call per request).

---

### OpenAPI — `import { setupOpenApi } from "@slyxup/shared"`

Registers an OpenAPI 3.0 JSON endpoint on a Hono app.

```ts
import { setupOpenApi } from "@slyxup/shared";

setupOpenApi(app, {
  title: "Auth API",
  version: "1.0.0",
  serverUrl: "https://auth.slyxup.online",
  serverDescription: "Production",
  pathPrefix: "/api/auth",   // optional, defaults to ""
});
// → GET /api/auth/openapi.json returns OpenAPI 3.0 spec
```

---

### Middleware — `import { rateLimit, applyDefaultRateLimit, requireApiKey, requireAdminKey, requireJwt } from "@slyxup/shared"`

Hono middleware functions for common auth and rate limiting patterns.

`rateLimit({ max, window })` — Generic rate limiter using in-memory store:
```ts
app.use("*", rateLimit({ max: 60, window: 60000 })); // 60 req/min
```

`applyDefaultRateLimit` — Pre-configured 60 req/min per IP per path:
```ts
app.use("*", applyDefaultRateLimit);
```

`requireApiKey` — Validates `X-API-Key` header against `c.env.API_KEY`:
```ts
app.use("/api/admin/*", requireApiKey);
```

`requireAdminKey` — Validates `X-Admin-Key` header against `c.env.ADMIN_KEY`:
```ts
app.use("/api/admin/*", requireAdminKey);
```

`requireJwt` — Checks `Authorization: Bearer <token>` header exists (does NOT verify the JWT — use `verifyToken` from jwt.ts for that):
```ts
app.use("/api/protected/*", requireJwt);
```

---

### CORS — `import { corsOrigin, isAllowedOrigin } from "@slyxup/shared"`

CORS origin validator for use with Hono's `cors()` middleware.

Allowed origins:
- `https://*.slyxup.online` (all product subdomains)
- `http://localhost:*` (local dev)
- `http://127.0.0.1:*` (local dev)
- `https://*.slyxup.pages.dev` (Cloudflare Pages preview deployments)

```ts
import { cors } from "hono/cors";
import { corsOrigin } from "@slyxup/shared";

app.use("*", cors({ origin: corsOrigin }));
```
