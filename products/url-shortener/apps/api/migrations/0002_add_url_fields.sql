ALTER TABLE urls ADD COLUMN title TEXT;
ALTER TABLE urls ADD COLUMN expires_at TEXT;
ALTER TABLE urls ADD COLUMN is_custom INTEGER NOT NULL DEFAULT 0;
ALTER TABLE urls ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;

CREATE INDEX idx_urls_slug ON urls(slug);
CREATE INDEX idx_urls_user_id ON urls(user_id);
CREATE INDEX idx_urls_created_at ON urls(created_at);
