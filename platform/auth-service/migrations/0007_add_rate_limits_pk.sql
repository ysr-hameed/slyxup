CREATE TABLE rate_limits_new (
  ip TEXT NOT NULL,
  route TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  window_start TEXT NOT NULL,
  PRIMARY KEY (ip, route, window_start)
);

INSERT INTO rate_limits_new SELECT * FROM rate_limits;

DROP TABLE rate_limits;

ALTER TABLE rate_limits_new RENAME TO rate_limits;
