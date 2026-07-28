#!/usr/bin/env bash
set -e

ENV="${1:-production}"

echo "╔════════════════════════════════════════╗"
echo "║       SlyxUp Deployment Script        ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Environment: $ENV"
echo ""

# 1. Set up secrets
echo "─── 1. Setting secrets ──────────────────"
if [ "$ENV" = "production" ]; then
  echo "Setting BETTER_AUTH_SECRET..."
  echo -n | wrangler secret put BETTER_AUTH_SECRET --env production

  echo "Setting GOOGLE_CLIENT_ID..."
  echo -n | wrangler secret put GOOGLE_CLIENT_ID --env production

  echo "Setting GOOGLE_CLIENT_SECRET..."
  echo -n | wrangler secret put GOOGLE_CLIENT_SECRET --env production

  echo "Setting GITHUB_CLIENT_ID..."
  echo -n | wrangler secret put GITHUB_CLIENT_ID --env production

  echo "Setting GITHUB_CLIENT_SECRET..."
  echo -n | wrangler secret put GITHUB_CLIENT_SECRET --env production

  echo "Setting SEND_FROM_EMAIL..."
  echo -n | wrangler secret put SEND_FROM_EMAIL --env production
fi

# 2. Run database migrations
echo "─── 2. Running migrations ───────────────"
pnpm db:generate
pnpm db:migrate

# 3. Run tests
echo "─── 3. Running tests ────────────────────"
pnpm test

# 4. Build all packages
echo "─── 4. Building packages ────────────────"
pnpm build

# 5. Deploy API Worker
echo "─── 5. Deploying API Worker ─────────────"
cd apps/api
pnpm wrangler deploy --minify --env "$ENV"
cd ../..

echo ""
echo "✓ Deployment complete!"
