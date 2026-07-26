-- Keep legacy vouchers explicitly unresolved while giving future raw inserts the
-- same base-currency defaults used by the accounting posting service.
-- Setting a default does not rewrite existing rows.
ALTER TABLE vouchers
  ALTER COLUMN currency SET DEFAULT 'USD',
  ALTER COLUMN exchange_rate SET DEFAULT 1;
