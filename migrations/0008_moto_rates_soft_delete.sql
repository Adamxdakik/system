-- Pass D follow-up: add soft-delete to moto-rate tables so historical rate
-- configurations are preserved (replace-all semantics no longer destroy history).
-- Idempotent: safe to re-run.

-- 1. Add deleted_at columns
ALTER TABLE employee_moto_rates
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

ALTER TABLE employee_moto_pct_rates
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;

-- 2. The existing UNIQUE(employee_id, location_id) constraint must be relaxed
--    to apply only to live rows; otherwise soft-deleted rows block re-insertion
--    of a new live row at the same (employee, location) key.

-- Drop the strict UNIQUE constraint if present (created by 0007).
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employee_moto_rates_emp_loc_unique'
  ) THEN
    ALTER TABLE employee_moto_rates DROP CONSTRAINT employee_moto_rates_emp_loc_unique;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employee_moto_pct_rates_emp_loc_unique'
  ) THEN
    ALTER TABLE employee_moto_pct_rates DROP CONSTRAINT employee_moto_pct_rates_emp_loc_unique;
  END IF;
END $$;

-- Recreate as partial UNIQUE indexes scoped to live rows (deleted_at IS NULL).
CREATE UNIQUE INDEX IF NOT EXISTS employee_moto_rates_emp_loc_live_unique
  ON employee_moto_rates (employee_id, location_id)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS employee_moto_pct_rates_emp_loc_live_unique
  ON employee_moto_pct_rates (employee_id, location_id)
  WHERE deleted_at IS NULL;

-- Helpful index for "show me history of an employee's rates"
CREATE INDEX IF NOT EXISTS employee_moto_rates_emp_idx
  ON employee_moto_rates (employee_id);
CREATE INDEX IF NOT EXISTS employee_moto_pct_rates_emp_idx
  ON employee_moto_pct_rates (employee_id);
