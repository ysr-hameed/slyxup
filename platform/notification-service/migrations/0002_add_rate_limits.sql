CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT NOT NULL,
  route TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TEXT NOT NULL,
  PRIMARY KEY (ip, route, window_start)
);
