-- Recreate admin_users with extended roles and deleted_at
CREATE TABLE IF NOT EXISTS admin_users_new (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'readonly',
  deleted_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO admin_users_new (id, email, name, password_hash, role, created_at, updated_at)
  SELECT id, email, name, password_hash, role, created_at, updated_at FROM admin_users;

DROP TABLE admin_users;
ALTER TABLE admin_users_new RENAME TO admin_users;

-- Add columns to audit_logs
ALTER TABLE audit_logs ADD COLUMN ip TEXT;
ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;
ALTER TABLE audit_logs ADD COLUMN request_id TEXT;
ALTER TABLE audit_logs ADD COLUMN success INTEGER NOT NULL DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
