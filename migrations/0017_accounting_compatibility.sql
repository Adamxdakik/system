-- Bring the historical SQL migration chain up to the accounting schema used by
-- the application and Program 2 integration tests. All changes are additive.

ALTER TABLE voucher_entries
  ADD COLUMN IF NOT EXISTS employee_id INTEGER;

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(20, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_balance_side TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- The application allows customers without an email address.
ALTER TABLE customers
  ALTER COLUMN email DROP NOT NULL;

CREATE TABLE IF NOT EXISTS customer_balances (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL,
  reference_id INTEGER,
  reference_type TEXT,
  debit_amount NUMERIC(20, 2) NOT NULL DEFAULT 0,
  credit_amount NUMERIC(20, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(20, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_balances_customer_company_idx
  ON customer_balances(customer_id, company_id);
