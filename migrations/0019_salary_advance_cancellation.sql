ALTER TABLE salary_advances
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(100),
  ADD COLUMN IF NOT EXISTS cancellation_voucher_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS salary_advances_cancellation_voucher_unique
  ON salary_advances(cancellation_voucher_id)
  WHERE cancellation_voucher_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'salary_advances_cancellation_voucher_fk'
  ) THEN
    ALTER TABLE salary_advances
      ADD CONSTRAINT salary_advances_cancellation_voucher_fk
      FOREIGN KEY (cancellation_voucher_id) REFERENCES vouchers(id) ON DELETE RESTRICT;
  END IF;
END $$;
