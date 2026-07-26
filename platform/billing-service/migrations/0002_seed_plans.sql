INSERT INTO plans (id, name, description, platform, amount, currency, interval, created_at)
VALUES
  ('plan_pro_monthly', 'Pro Monthly', 'Unlimited URLs, custom slugs, no expiry. For power users.',
   'url-shortener', 999, 'USD', 'month', datetime('now')),
  ('plan_pro_yearly', 'Pro Yearly', 'All Pro features at a discount. Two months free.',
   'url-shortener', 9990, 'USD', 'year', datetime('now'));
