CREATE TABLE IF NOT EXISTS urls (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  target TEXT NOT NULL,
  title TEXT,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_urls_code ON urls(code);
CREATE INDEX IF NOT EXISTS idx_urls_user_id ON urls(user_id);
