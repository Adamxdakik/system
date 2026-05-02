-- C2: effective-dated rates — preserve full history of a rate, not just
-- "active vs soft-deleted". A rate change in May should not retroactively
-- re-cost April's payroll.
--
-- Strategy: keep the soft-delete model (deleted_at) but additionally store
-- the validity window. For backward compat, existing rows get effective_from
-- = created_at and effective_to = NULL. Soft-delete also sets effective_to
-- = NOW() so range queries are correct.

ALTER TABLE employee_moto_rates
  ADD COLUMN IF NOT EXISTS effective_from TIMESTAMP,
  ADD COLUMN IF NOT EXISTS effective_to TIMESTAMP;

ALTER TABLE employee_moto_pct_rates
  ADD COLUMN IF NOT EXISTS effective_from TIMESTAMP,
  ADD COLUMN IF NOT EXISTS effective_to TIMESTAMP;

-- Backfill: existing live rows are valid since they were created.
UPDATE employee_moto_rates
   SET effective_from = COALESCE(effective_from, created_at)
 WHERE effective_from IS NULL;

UPDATE employee_moto_pct_rates
   SET effective_from = COALESCE(effective_from, created_at)
 WHERE effective_from IS NULL;

-- Soft-deleted rows that have no effective_to yet get it set to deleted_at.
UPDATE employee_moto_rates
   SET effective_to = deleted_at
 WHERE deleted_at IS NOT NULL AND effective_to IS NULL;

UPDATE employee_moto_pct_rates
   SET effective_to = deleted_at
 WHERE deleted_at IS NOT NULL AND effective_to IS NULL;

CREATE INDEX IF NOT EXISTS idx_emr_effective ON employee_moto_rates (employee_id, location_id, effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_empr_effective ON employee_moto_pct_rates (employee_id, location_id, effective_from, effective_to);
