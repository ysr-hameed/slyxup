ALTER TABLE users ADD COLUMN platform TEXT NOT NULL DEFAULT 'default';
CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform);
