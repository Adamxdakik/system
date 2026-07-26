-- Program 4C: connect service, warranty, communication, and assembly history
-- to an individual motorcycle without changing accounting or stock movements.
-- The service-center and assembly tables historically came from the runtime
-- schema, so create compatible versions when a clean SQL-only migration chain
-- does not already contain them.

CREATE TABLE IF NOT EXISTS service_history (
  id serial PRIMARY KEY,
  company_id integer NOT NULL,
  customer_id integer NOT NULL,
  service_date date NOT NULL,
  bike_model text NOT NULL,
  mileage integer,
  service_type varchar(50) NOT NULL,
  parts_used text,
  technician_name varchar(100),
  notes text,
  deleted_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS warranties (
  id serial PRIMARY KEY,
  company_id integer NOT NULL,
  customer_id integer NOT NULL,
  bike_model text NOT NULL,
  warranty_start_date date NOT NULL,
  warranty_duration integer NOT NULL,
  warranty_status varchar(20) NOT NULL DEFAULT 'Active',
  void_reason text,
  notes text,
  deleted_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS communication_logs (
  id serial PRIMARY KEY,
  company_id integer NOT NULL,
  customer_id integer NOT NULL,
  contact_date date NOT NULL,
  contact_type varchar(20) NOT NULL,
  notes text,
  deleted_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assembly_history (
  id serial PRIMARY KEY,
  company_id integer NOT NULL,
  location_id integer NOT NULL,
  user_id varchar NOT NULL,
  username text,
  stock_item_id integer NOT NULL,
  stock_item_name text,
  action_type text NOT NULL,
  from_stage text,
  to_stage text,
  qty_changed integer NOT NULL,
  description text,
  technician text,
  status text DEFAULT 'pending',
  completed boolean DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE service_history
  ADD COLUMN IF NOT EXISTS motorcycle_id integer;

ALTER TABLE warranties
  ADD COLUMN IF NOT EXISTS motorcycle_id integer;

ALTER TABLE communication_logs
  ADD COLUMN IF NOT EXISTS motorcycle_id integer;

CREATE INDEX IF NOT EXISTS service_history_motorcycle_idx
  ON service_history (company_id, motorcycle_id)
  WHERE deleted_at IS NULL AND motorcycle_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS warranties_motorcycle_idx
  ON warranties (company_id, motorcycle_id)
  WHERE deleted_at IS NULL AND motorcycle_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS communication_logs_motorcycle_idx
  ON communication_logs (company_id, motorcycle_id)
  WHERE deleted_at IS NULL AND motorcycle_id IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_history_motorcycle_id_fkey'
  ) THEN
    ALTER TABLE service_history
      ADD CONSTRAINT service_history_motorcycle_id_fkey
      FOREIGN KEY (motorcycle_id) REFERENCES bike_purchases(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'warranties_motorcycle_id_fkey'
  ) THEN
    ALTER TABLE warranties
      ADD CONSTRAINT warranties_motorcycle_id_fkey
      FOREIGN KEY (motorcycle_id) REFERENCES bike_purchases(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'communication_logs_motorcycle_id_fkey'
  ) THEN
    ALTER TABLE communication_logs
      ADD CONSTRAINT communication_logs_motorcycle_id_fkey
      FOREIGN KEY (motorcycle_id) REFERENCES bike_purchases(id) ON DELETE RESTRICT;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS assembly_history_motorcycles (
  id serial PRIMARY KEY,
  company_id integer NOT NULL,
  assembly_history_id integer NOT NULL,
  motorcycle_id integer NOT NULL,
  created_by_user_id varchar,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT assembly_history_motorcycles_history_fkey
    FOREIGN KEY (assembly_history_id) REFERENCES assembly_history(id) ON DELETE RESTRICT,
  CONSTRAINT assembly_history_motorcycles_motorcycle_fkey
    FOREIGN KEY (motorcycle_id) REFERENCES bike_purchases(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS assembly_history_motorcycles_motorcycle_unique
  ON assembly_history_motorcycles (motorcycle_id);

CREATE UNIQUE INDEX IF NOT EXISTS assembly_history_motorcycles_history_motorcycle_unique
  ON assembly_history_motorcycles (assembly_history_id, motorcycle_id);

CREATE INDEX IF NOT EXISTS assembly_history_motorcycles_company_history_idx
  ON assembly_history_motorcycles (company_id, assembly_history_id);
