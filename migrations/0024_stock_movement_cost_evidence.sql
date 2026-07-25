CREATE TABLE IF NOT EXISTS stock_movement_cost_evidence (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  original_voucher_id INTEGER NOT NULL REFERENCES vouchers(id) ON DELETE RESTRICT,
  movement_kind VARCHAR(20) NOT NULL,
  movement_item_id INTEGER NOT NULL,
  stock_item_id INTEGER NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
  source_location_id INTEGER REFERENCES locations(id) ON DELETE RESTRICT,
  destination_location_id INTEGER REFERENCES locations(id) ON DELETE RESTRICT,
  quantity NUMERIC(15, 3) NOT NULL,
  actual_unit_cost NUMERIC(20, 6) NOT NULL,
  actual_total_cost NUMERIC(20, 2) NOT NULL,
  evidence_status VARCHAR(32) NOT NULL,
  reversed_by_voucher_id INTEGER REFERENCES vouchers(id) ON DELETE RESTRICT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT stock_movement_evidence_kind_check
    CHECK (movement_kind IN ('TRANSFER', 'ADJUSTMENT')),
  CONSTRAINT stock_movement_evidence_status_check
    CHECK (evidence_status IN ('EXACT', 'DECLARED_PRODUCTION')),
  CONSTRAINT stock_movement_evidence_quantity_positive
    CHECK (quantity > 0),
  CONSTRAINT stock_movement_evidence_cost_non_negative
    CHECK (actual_total_cost >= 0 AND actual_unit_cost >= 0),
  CONSTRAINT stock_movement_evidence_item_unique
    UNIQUE (movement_kind, movement_item_id)
);

CREATE INDEX IF NOT EXISTS stock_movement_evidence_voucher_idx
  ON stock_movement_cost_evidence (company_id, original_voucher_id);

CREATE UNIQUE INDEX IF NOT EXISTS stock_movement_evidence_voucher_item_unique
  ON stock_movement_cost_evidence (original_voucher_id, movement_kind, movement_item_id);
