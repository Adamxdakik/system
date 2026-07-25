CREATE TABLE IF NOT EXISTS opening_balance_import_runs (
  id BIGSERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  import_type VARCHAR(100) NOT NULL,
  idempotency_key VARCHAR(200) NOT NULL,
  payload_hash VARCHAR(64) NOT NULL,
  row_count INTEGER NOT NULL,
  result_json JSONB NOT NULL,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS opening_balance_import_company_key_unique
  ON opening_balance_import_runs(company_id, import_type, idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS opening_balance_import_company_payload_unique
  ON opening_balance_import_runs(company_id, import_type, payload_hash);
