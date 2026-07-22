CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL CHECK(interval IN ('month', 'year')),
  paddle_price_id TEXT,
  created_at TEXT NOT NULL DEFAULT 'datetime(''now'')'
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK(status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),
  current_period_start TEXT NOT NULL,
  current_period_end TEXT NOT NULL,
  paddle_subscription_id TEXT,
  paddle_customer_id TEXT,
  created_at TEXT NOT NULL DEFAULT 'datetime(''now'')',
  updated_at TEXT NOT NULL DEFAULT 'datetime(''now'')'
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paddle_sub ON subscriptions(paddle_subscription_id);

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('paid', 'unpaid', 'past_due')),
  paddle_invoice_id TEXT,
  created_at TEXT NOT NULL DEFAULT 'datetime(''now'')'
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
