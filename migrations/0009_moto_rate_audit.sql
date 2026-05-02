-- Pass D follow-up: audit log for all moto-rate changes (who/when/what).
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS moto_rate_audit (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  table_name TEXT NOT NULL,                  -- 'employee_moto_rates' | 'employee_moto_pct_rates'
  action TEXT NOT NULL,                      -- 'replace' | 'copy_from' | 'bulk_set'
  before_data JSONB,                         -- snapshot of live rows before change
  after_data JSONB,                          -- snapshot of live rows after change
  user_id TEXT,                              -- session userId (nullable for system changes)
  source_employee_id INTEGER,                -- for copy_from action
  context JSONB,                             -- free-form (e.g. {locationId, employeeIds} for bulk_set)
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'moto_rate_audit_employee_fk'
  ) THEN
    ALTER TABLE moto_rate_audit
      ADD CONSTRAINT moto_rate_audit_employee_fk
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS moto_rate_audit_emp_idx ON moto_rate_audit (employee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS moto_rate_audit_table_idx ON moto_rate_audit (table_name, created_at DESC);
