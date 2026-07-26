-- Program 4C: connect service, warranty, communication, and assembly history
-- to an individual motorcycle without changing accounting or stock movements.

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
