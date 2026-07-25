-- Program 2B financial-integrity metadata and constraints.
-- This migration never rewrites an existing financial amount. It stops with a
-- clear exception when legacy rows violate a proposed invariant.

ALTER TABLE vouchers
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(20, 8) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS source_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS source_id VARCHAR(200),
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(200),
  ADD COLUMN IF NOT EXISTS idempotency_fingerprint VARCHAR(64),
  ADD COLUMN IF NOT EXISTS reversal_of_voucher_id INTEGER,
  ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);

ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS company_id INTEGER;

ALTER TABLE voucher_entries
  ADD COLUMN IF NOT EXISTS customer_id INTEGER,
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS foreign_amount NUMERIC(20, 2),
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(20, 8),
  ADD COLUMN IF NOT EXISTS base_amount NUMERIC(20, 2);

-- Base amount is a deterministic copy of the existing one-sided persisted
-- amount. This preserves history; it does not calculate or invent an FX value.
UPDATE voucher_entries
SET base_amount = CASE
  WHEN debit_amount > 0 THEN debit_amount
  ELSE credit_amount
END
WHERE base_amount IS NULL;

ALTER TABLE voucher_entries
  ALTER COLUMN base_amount SET DEFAULT 0,
  ALTER COLUMN base_amount SET NOT NULL,
  ALTER COLUMN debit_amount SET NOT NULL,
  ALTER COLUMN credit_amount SET NOT NULL;

CREATE TABLE IF NOT EXISTS financial_repair_audit (
  id BIGSERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  category VARCHAR(100) NOT NULL,
  dry_run BOOLEAN NOT NULL,
  confirmation_digest VARCHAR(64),
  before_state JSONB NOT NULL,
  after_state JSONB NOT NULL,
  created_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS financial_repair_audit_company_created_idx
  ON financial_repair_audit(company_id, created_at DESC);

DO $$
DECLARE
  invalid_count BIGINT;
BEGIN
  SELECT count(*) INTO invalid_count
  FROM voucher_entries
  WHERE debit_amount < 0 OR credit_amount < 0;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION '0013 financial integrity blocked: % voucher entries have negative debit/credit amounts; resolve manually', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM voucher_entries
  WHERE debit_amount > 0 AND credit_amount > 0;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION '0013 financial integrity blocked: % voucher entries contain both debit and credit; resolve manually', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM voucher_entries
  WHERE debit_amount = 0 AND credit_amount = 0;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION '0013 financial integrity blocked: % voucher entries are zero-valued; resolve manually', invalid_count;
  END IF;

  SELECT count(*) INTO invalid_count
  FROM (
    SELECT v.id
    FROM vouchers v
    LEFT JOIN voucher_entries ve ON ve.voucher_id = v.id
    WHERE NOT v.optional AND v.deleted_at IS NULL
    GROUP BY v.id
    HAVING count(ve.id) < 2
      OR coalesce(sum(ve.debit_amount), 0) <> coalesce(sum(ve.credit_amount), 0)
  ) invalid_vouchers;
  IF invalid_count > 0 THEN
    RAISE EXCEPTION '0013 financial integrity blocked: % active vouchers are unbalanced or have fewer than two entries; resolve manually', invalid_count;
  END IF;
END $$;

ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS vouchers_voucher_number_unique;

CREATE UNIQUE INDEX IF NOT EXISTS vouchers_company_number_unique
  ON vouchers(company_id, voucher_number);
CREATE UNIQUE INDEX IF NOT EXISTS vouchers_company_idempotency_unique
  ON vouchers(company_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS vouchers_company_source_unique
  ON vouchers(company_id, source_type, source_id)
  WHERE source_type IS NOT NULL AND source_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS vouchers_reversal_of_unique
  ON vouchers(reversal_of_voucher_id)
  WHERE reversal_of_voucher_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vouchers_exchange_rate_positive') THEN
    ALTER TABLE vouchers
      ADD CONSTRAINT vouchers_exchange_rate_positive CHECK (exchange_rate > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vouchers_reversal_of_fk') THEN
    ALTER TABLE vouchers
      ADD CONSTRAINT vouchers_reversal_of_fk
      FOREIGN KEY (reversal_of_voucher_id) REFERENCES vouchers(id) ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voucher_entries_debit_non_negative') THEN
    ALTER TABLE voucher_entries
      ADD CONSTRAINT voucher_entries_debit_non_negative CHECK (debit_amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voucher_entries_credit_non_negative') THEN
    ALTER TABLE voucher_entries
      ADD CONSTRAINT voucher_entries_credit_non_negative CHECK (credit_amount >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voucher_entries_one_sided') THEN
    ALTER TABLE voucher_entries
      ADD CONSTRAINT voucher_entries_one_sided
      CHECK (NOT (debit_amount > 0 AND credit_amount > 0));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voucher_entries_meaningful') THEN
    ALTER TABLE voucher_entries
      ADD CONSTRAINT voucher_entries_meaningful
      CHECK (debit_amount > 0 OR credit_amount > 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'voucher_entries_fx_complete') THEN
    ALTER TABLE voucher_entries
      ADD CONSTRAINT voucher_entries_fx_complete
      CHECK (currency = 'USD' OR (foreign_amount IS NOT NULL AND exchange_rate > 0));
  END IF;
END $$;
