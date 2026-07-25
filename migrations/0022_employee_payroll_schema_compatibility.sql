-- Add modern employee fields selected by the application schema. These columns
-- are additive and preserve all historical payroll amounts.
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS sales_bonus_pct NUMERIC(10, 4),
  ADD COLUMN IF NOT EXISTS sales_bonus_pct_source_company_id INTEGER,
  ADD COLUMN IF NOT EXISTS sales_bonus_pct_location_id INTEGER,
  ADD COLUMN IF NOT EXISTS motos_bonus_rate NUMERIC(10, 4),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
