# Deployment Guide

## Architecture Overview

```
7 Cloudflare Workers → 7 Cloudflare accounts → 7 custom domains
                      ↓
              SDK package (@slyxup/sdk)
                      ↓
              Products (e.g. url-shortener)
```

Every service deploys independently. No shared infrastructure.

---

## Prerequisites

```bash
# Install tools
npm install -g pnpm wrangler
pnpm install
```

You need **7 Cloudflare accounts** (one per service) or you can deploy multiple services to the same account if you don't need isolation.

---

## 1. D1 Databases

Create databases in each account:

```bash
# Auth (Account #1)
npx wrangler d1 create slyxup-auth

# Billing (Account #2)
npx wrangler d1 create slyxup-billing

# Analytics (Account #4)
npx wrangler d1 create slyxup-analytics

# Admin (Account #6)
npx wrangler d1 create slyxup-admin

# Notification (Account #7)
npx wrangler d1 create slyxup-notification

# URL Shortener product (use auth account or own account)
npx wrangler d1 create slyxup-url-shortener
```

After each `d1 create`, copy the `database_id` from the output.

**Email + Storage** have no D1 (Brevo API / R2).

---

## 2. Update `database_id`

Edit each service's `wrangler.jsonc` and replace the placeholder `database_id` with the real ID from the previous step:

| File | Database |
|------|----------|
| `platform/auth-service/wrangler.jsonc` | `slyxup-auth` |
| `platform/billing-service/wrangler.jsonc` | `slyxup-billing` |
| `platform/analytics-service/wrangler.jsonc` | `slyxup-analytics` |
| `platform/admin-service/wrangler.jsonc` | `slyxup-admin` |
| `platform/notification-service/wrangler.jsonc` | `slyxup-notification` |
| `products/url-shortener/apps/api/wrangler.jsonc` | `slyxup-url-shortener` |

```jsonc
// Example: platform/auth-service/wrangler.jsonc
"d1_databases": [{
  "binding": "DB",
  "database_name": "slyxup-auth",
  "database_id": "<real-uuid-from-wrangler-d1-create>",
  "migrations_dir": "migrations"
}]
```

---

## 3. R2 Bucket

For Storage service (Account #5):

```bash
npx wrangler r2 bucket create slyxup-storage
npx wrangler r2 bucket create slyxup-storage-dev  # preview
```

---

## 4. Run Migrations

```bash
# For each service with a DB:
cd platform/auth-service && npx wrangler d1 migrations apply slyxup-auth --remote
cd platform/billing-service && npx wrangler d1 migrations apply slyxup-billing --remote
cd platform/analytics-service && npx wrangler d1 migrations apply slyxup-analytics --remote
cd platform/admin-service && npx wrangler d1 migrations apply slyxup-admin --remote
cd platform/notification-service && npx wrangler d1 migrations apply slyxup-notification --remote
cd products/url-shortener/apps/api && npx wrangler d1 migrations apply slyxup-url-shortener --remote
```

Or from root using the deploy account's wrangler:

```bash
npx wrangler d1 migrations apply slyxup-auth --remote
# etc.
```

---

## 5. Secrets

Each service needs environment variables set via `wrangler secret put`:

### Auth Service (Account #1)
```bash
cd platform/auth-service
npx wrangler secret put JWT_SECRET
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_CALLBACK_URL
npx wrangler secret put ENVIRONMENT
```

### Billing Service (Account #2)
```bash
cd platform/billing-service
npx wrangler secret put PADDLE_API_KEY
npx wrangler secret put PADDLE_WEBHOOK_SECRET
npx wrangler secret put ENVIRONMENT
```

### Email Service (Account #3)
```bash
cd platform/email-service
npx wrangler secret put BREVO_API_KEY
npx wrangler secret put FROM_EMAIL
npx wrangler secret put SUPPORT_EMAIL
npx wrangler secret put ENVIRONMENT
```

### Analytics Service (Account #4)
```bash
cd platform/analytics-service
npx wrangler secret put ENVIRONMENT
```

### Storage Service (Account #5)
```bash
cd platform/storage-service
npx wrangler secret put ENVIRONMENT
npx wrangler secret put R2_PUBLIC_URL
```

### Admin Service (Account #6)
```bash
cd platform/admin-service
npx wrangler secret put JWT_SECRET
npx wrangler secret put ADMIN_KEY
npx wrangler secret put ENVIRONMENT
```

### Notification Service (Account #7)
```bash
cd platform/notification-service
npx wrangler secret put ENVIRONMENT
```

### URL Shortener Product
```bash
cd products/url-shortener/apps/api
npx wrangler secret put ENVIRONMENT
npx wrangler secret put AUTH_SERVICE_URL
npx wrangler secret put BILLING_SERVICE_URL
npx wrangler secret put EMAIL_SERVICE_URL
npx wrangler secret put ANALYTICS_SERVICE_URL
npx wrangler secret put STORAGE_SERVICE_URL
```

---

## 6. Deploy

```bash
# Deploy platform services (from each service directory)
cd platform/auth-service && npx wrangler deploy
cd platform/billing-service && npx wrangler deploy
cd platform/email-service && npx wrangler deploy
cd platform/analytics-service && npx wrangler deploy
cd platform/storage-service && npx wrangler deploy
cd platform/admin-service && npx wrangler deploy
cd platform/notification-service && npx wrangler deploy

# Or from root using pnpm filters:
pnpm --filter @slyxup/auth-service deploy
pnpm --filter @slyxup/billing-service deploy
# ... etc
```

Each deploy requires authenticating with the corresponding Cloudflare account:

```bash
# Before deploying each service, login to its account:
npx wrangler login           # Account #1 → deploy auth
npx wrangler login           # Account #2 → deploy billing (after logout/login)
# ...
```

---

## 7. Custom Domains

DNS is already configured in each `wrangler.jsonc` via `routes` with `custom_domain: true`:

```jsonc
"routes": [{ "pattern": "auth.slyxup.in", "custom_domain": true }]
```

When you deploy, Cloudflare automatically provisions the custom domain if `slyxup.in` zone is in the same account.

If the zone is in a different account, create CNAME records manually:

| Domain | Target |
|--------|--------|
| `auth.slyxup.in` | `auth.<account-id>.workers.dev` |
| `billing.slyxup.in` | `billing.<account-id>.workers.dev` |
| `email.slyxup.in` | `email.<account-id>.workers.dev` |
| `analytics.slyxup.in` | `analytics.<account-id>.workers.dev` |
| `storage.slyxup.in` | `storage.<account-id>.workers.dev` |
| `admin.slyxup.in` | `admin.<account-id>.workers.dev` |
| `notification.slyxup.in` | `notification.<account-id>.workers.dev` |

To find the Workers.dev domain:

```bash
npx wrangler whoami
# Look for: Your subdomain: https://<account-subdomain>.workers.dev
# Your worker URL: https://auth.<account-subdomain>.workers.dev
```

---

## 8. SDK Usage in Products

Products consume the SDK as a dependency:

```jsonc
// products/my-app/package.json
{
  "dependencies": {
    "@slyxup/sdk": "workspace:*",
    "@slyxup/shared": "workspace:*"
  }
}
```

The SDK auto-detects production URLs when no `baseUrl` is provided:

```ts
import { createSlyxupClient } from "@slyxup/sdk";

// In production — uses *.slyxup.in by default
const api = createSlyxupClient({ apiKey: "sk-..." });

// In development — override base URLs
const api = createSlyxupClient({
  authBaseUrl: "http://localhost:8000",
  billingBaseUrl: "http://localhost:8001",
  analyticsBaseUrl: "http://localhost:8003",
  storageBaseUrl: "http://localhost:8004",
});
```

### Publishing SDK externally

If products are in separate repos, you have 3 options:

**Option A — workspace protocol (monorepo)**
Keep everything in this monorepo. The SDK is available via `workspace:*`.

**Option B — npm publish**
```bash
cd packages/sdk
npm publish --access public
```
Then products install: `npm install @slyxup/sdk`

**Option C — copy as source**
Copy `packages/sdk/` and its client dependencies into each product repo.
Simplest approach for isolated repos.

---

## 9. Product Deployment Example (URL Shortener)

### API Worker
```bash
cd products/url-shortener/apps/api
npx wrangler deploy
```

### Frontend (Vite + React)
```bash
cd products/url-shortener/apps/web
pnpm build
npx wrangler pages deploy dist
```

Or deploy to Cloudflare Pages via the dashboard.

---

## 10. CI/CD (GitHub Actions)

No workflows exist yet. Here's a starting template for `.github/workflows/deploy.yml`:

```yaml
name: Deploy Auth Service

on:
  push:
    branches: [main]
    paths:
      - "platform/auth-service/**"
      - "packages/shared/**"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install
      - run: npx wrangler deploy
        working-directory: platform/auth-service
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN_AUTH }}
```

Each service deploys independently, so create one workflow per service.

---

## 11. Verification

After deploying all services, verify the chain works:

```bash
# Register a user
curl -X POST https://auth.slyxup.in/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User","platform":"url-shortener"}'

# Login
curl -s -X POST https://auth.slyxup.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","platform":"url-shortener"}'

# Check plans
curl https://billing.slyxup.in/api/billing/plans

# Track an event
curl -X POST https://analytics.slyxup.in/api/analytics/event \
  -H "Content-Type: application/json" \
  -d '{"name":"page_view","platform":"url-shortener"}'

# Upload a file
curl -X POST https://storage.slyxup.in/api/storage/upload \
  -F "file=@test.txt"
```

---

## 12. Production Checklist

- [ ] All 5 D1 databases created and migrated
- [ ] R2 bucket created for storage
- [ ] All secrets set via `wrangler secret put`
- [ ] Custom domains configured (or CNAME records)
- [ ] Products deployed and pointing to production SDK URLs
- [ ] SSL auto-provisioned by Cloudflare
- [ ] Monitoring + alerts configured per account
- [ ] Rate limiting / DDoS protection (Cloudflare WAF)
