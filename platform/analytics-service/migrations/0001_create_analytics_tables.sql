CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  user_id TEXT,
  platform TEXT NOT NULL,
  properties TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS page_views (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  user_id TEXT,
  platform TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip TEXT,
  created_at TEXT NOT NULL
);
