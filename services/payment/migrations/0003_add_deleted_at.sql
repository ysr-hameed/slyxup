ALTER TABLE plans ADD COLUMN deleted_at TEXT;
ALTER TABLE subscriptions ADD COLUMN deleted_at TEXT;
ALTER TABLE invoices ADD COLUMN deleted_at TEXT;
