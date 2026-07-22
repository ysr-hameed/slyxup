-- Create platforms table
CREATE TABLE IF NOT EXISTS platforms (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT,
  domain TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create platform_memberships table
CREATE TABLE IF NOT EXISTS platform_memberships (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform_id TEXT NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_user_platform ON platform_memberships(user_id, platform_id);
CREATE INDEX IF NOT EXISTS idx_membership_platform ON platform_memberships(platform_id);

-- Add sessions columns
ALTER TABLE sessions ADD COLUMN ip TEXT;
ALTER TABLE sessions ADD COLUMN user_agent TEXT;
ALTER TABLE sessions ADD COLUMN last_seen TEXT;
ALTER TABLE sessions ADD COLUMN revoked_at TEXT;

-- Make email globally unique (SSO model), drop per-platform unique
DROP INDEX IF EXISTS users_email_unique;

-- Drop platform column from users (now using platform_memberships)
DROP INDEX IF EXISTS idx_users_platform;
ALTER TABLE users DROP COLUMN platform;

-- Insert default platform if not exists
INSERT OR IGNORE INTO platforms (id, slug, name, status)
  VALUES ('default', 'default', 'Default Platform', 'active');
