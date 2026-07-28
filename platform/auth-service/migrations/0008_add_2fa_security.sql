-- Add 2FA and security columns to users
ALTER TABLE users ADD COLUMN auth_provider TEXT NOT NULL DEFAULT 'email';
ALTER TABLE users ADD COLUMN blocked_at TEXT;
ALTER TABLE users ADD COLUMN blocked_reason TEXT;
ALTER TABLE users ADD COLUMN verification_code TEXT;
ALTER TABLE users ADD COLUMN verification_expiry TEXT;
ALTER TABLE users ADD COLUMN verification_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN two_factor_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN email_2fa_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN preferred_2fa TEXT DEFAULT 'authenticator';
ALTER TABLE users ADD COLUMN login_otp TEXT;
ALTER TABLE users ADD COLUMN login_otp_expiry TEXT;
ALTER TABLE users ADD COLUMN backup_codes TEXT;
ALTER TABLE users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE users ADD COLUMN pending_plan TEXT;

-- Revoked tokens table for JWT invalidation
CREATE TABLE IF NOT EXISTS revoked_tokens (
  token_hash TEXT PRIMARY KEY,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Security event logs
CREATE TABLE IF NOT EXISTS security_logs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  user_id TEXT,
  ip TEXT,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS security_logs_type_idx ON security_logs(type);
CREATE INDEX IF NOT EXISTS security_logs_user_id_idx ON security_logs(user_id);

-- Trusted devices for 2FA bypass
CREATE TABLE IF NOT EXISTS trusted_devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  trusted_at TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  device_name TEXT
);
CREATE INDEX IF NOT EXISTS trusted_devices_user_id_idx ON trusted_devices(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS trusted_devices_user_fingerprint_unique ON trusted_devices(user_id, fingerprint);

-- Blocked IPs
CREATE TABLE IF NOT EXISTS blocked_ips (
  id TEXT PRIMARY KEY,
  ip TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TEXT NOT NULL,
  expires_at TEXT,
  permanent INTEGER NOT NULL DEFAULT 1
);
