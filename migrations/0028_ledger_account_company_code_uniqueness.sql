ALTER TABLE ledger_accounts
  DROP CONSTRAINT IF EXISTS ledger_accounts_code_unique;

DROP INDEX IF EXISTS ledger_accounts_code_unique;

CREATE UNIQUE INDEX IF NOT EXISTS ledger_accounts_company_code_unique
  ON ledger_accounts (company_id, code);
