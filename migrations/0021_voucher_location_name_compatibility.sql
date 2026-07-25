-- Bring the historical SQL migration chain up to the voucher shape selected by
-- the current application schema. This is additive and does not rewrite history.
ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS location_name TEXT;
