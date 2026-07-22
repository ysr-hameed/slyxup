ALTER TABLE plans ADD COLUMN platform TEXT NOT NULL DEFAULT 'default';
ALTER TABLE subscriptions ADD COLUMN platform TEXT NOT NULL DEFAULT 'default';
ALTER TABLE invoices ADD COLUMN platform TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_subscriptions_platform ON subscriptions(platform);
CREATE INDEX IF NOT EXISTS idx_invoices_platform ON invoices(platform);
