-- Program 4A: first-class, individually tracked motorcycle records.
-- Existing bike_purchases rows remain valid; new registry fields are nullable for legacy compatibility.

ALTER TABLE bike_purchases
  ALTER COLUMN customer_id DROP NOT NULL,
  ALTER COLUMN sale_date DROP NOT NULL;

ALTER TABLE bike_purchases
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS engine_number varchar(100),
  ADD COLUMN IF NOT EXISTS chassis_number varchar(100),
  ADD COLUMN IF NOT EXISTS model_year integer,
  ADD COLUMN IF NOT EXISTS purchase_cost numeric(15, 2),
  ADD COLUMN IF NOT EXISTS selling_price numeric(15, 2),
  ADD COLUMN IF NOT EXISTS location_id integer,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS supplier_id integer,
  ADD COLUMN IF NOT EXISTS container_id integer,
  ADD COLUMN IF NOT EXISTS warranty_end_date date,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp without time zone DEFAULT now();

UPDATE bike_purchases
SET status = 'SOLD'
WHERE status IS NULL
  AND customer_id IS NOT NULL;

UPDATE bike_purchases
SET status = 'IN_STOCK'
WHERE status IS NULL;

ALTER TABLE bike_purchases
  ALTER COLUMN status SET DEFAULT 'IN_STOCK',
  ALTER COLUMN status SET NOT NULL;

UPDATE bike_purchases
SET updated_at = COALESCE(updated_at, created_at, now())
WHERE updated_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bike_purchases_company_engine_unique
  ON bike_purchases (company_id, lower(engine_number))
  WHERE engine_number IS NOT NULL
    AND btrim(engine_number) <> ''
    AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bike_purchases_company_chassis_unique
  ON bike_purchases (company_id, lower(chassis_number))
  WHERE chassis_number IS NOT NULL
    AND btrim(chassis_number) <> ''
    AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS bike_purchases_company_status_idx
  ON bike_purchases (company_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS bike_purchases_company_location_idx
  ON bike_purchases (company_id, location_id)
  WHERE deleted_at IS NULL;
