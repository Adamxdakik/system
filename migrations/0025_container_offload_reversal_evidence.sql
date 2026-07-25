ALTER TABLE suppliers
  ADD COLUMN IF NOT EXISTS company_id INTEGER,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT,
  ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE locations
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE stock_groups
  ADD COLUMN IF NOT EXISTS parent_id INTEGER,
  ADD COLUMN IF NOT EXISTS allocate_import_costs BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

ALTER TABLE stock_items
  ADD COLUMN IF NOT EXISTS stock_group_id INTEGER,
  ADD COLUMN IF NOT EXISTS uom TEXT NOT NULL DEFAULT 'pcs',
  ADD COLUMN IF NOT EXISTS opening_qty NUMERIC(15, 3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_rate NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opening_value NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reorder_level NUMERIC(15, 3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS selling_price NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS container_offload_inventory_evidence (
  id SERIAL PRIMARY KEY,
  offload_id INTEGER NOT NULL,
  container_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  inventory_id INTEGER NOT NULL,
  stock_item_id INTEGER NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
  before_exists BOOLEAN NOT NULL,
  before_quantity NUMERIC(15, 3) NOT NULL,
  before_average_rate NUMERIC(20, 2) NOT NULL,
  before_total_value NUMERIC(20, 2) NOT NULL,
  after_quantity NUMERIC(15, 3) NOT NULL,
  after_average_rate NUMERIC(20, 2) NOT NULL,
  after_total_value NUMERIC(20, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT container_offload_inventory_evidence_unique
    UNIQUE (offload_id, stock_item_id)
);

CREATE INDEX IF NOT EXISTS container_offload_inventory_evidence_container_idx
  ON container_offload_inventory_evidence (company_id, container_id, offload_id);

CREATE TABLE IF NOT EXISTS container_offload_voucher_links (
  id SERIAL PRIMARY KEY,
  offload_id INTEGER NOT NULL,
  container_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  voucher_id INTEGER NOT NULL REFERENCES vouchers(id) ON DELETE RESTRICT,
  role VARCHAR(32) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT container_offload_voucher_link_unique UNIQUE (offload_id, voucher_id),
  CONSTRAINT container_offload_voucher_role_check
    CHECK (role IN ('DUTIES', 'TRANSPORT', 'ADDITIONAL_CHARGE'))
);

CREATE INDEX IF NOT EXISTS container_offload_voucher_links_container_idx
  ON container_offload_voucher_links (company_id, container_id, offload_id);

CREATE TABLE IF NOT EXISTS container_offload_reversal_log (
  id SERIAL PRIMARY KEY,
  offload_id INTEGER NOT NULL UNIQUE,
  container_id INTEGER NOT NULL,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  transaction_date DATE NOT NULL,
  reason TEXT,
  idempotency_key TEXT NOT NULL,
  created_by TEXT,
  snapshot JSONB NOT NULL,
  reversal_voucher_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT container_offload_reversal_idempotency_unique
    UNIQUE (company_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS container_offload_reversal_container_idx
  ON container_offload_reversal_log (company_id, container_id, created_at DESC);
