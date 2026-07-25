-- Add the soft-delete field selected by the current ledger account schema.
-- This is additive and does not change any historical account balances.
ALTER TABLE ledger_accounts
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
