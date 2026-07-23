-- Pass C: rename internal "bale" columns to "moto" and add per-employee per-location moto rate tables.
-- Idempotent: safe to re-run on every deploy.

-- 1. Rename employees.bales_bonus_rate -> motos_bonus_rate
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'bales_bonus_rate'
  ) THEN
    ALTER TABLE employees RENAME COLUMN bales_bonus_rate TO motos_bonus_rate;
  END IF;
END $$;

-- 2. Rename container_offloads.total_bales -> total_motos
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'container_offloads' AND column_name = 'total_bales'
  ) THEN
    ALTER TABLE container_offloads RENAME COLUMN total_bales TO total_motos;
  END IF;
END $$;

-- 3. Rename container_offloads.additional_cost_per_bale -> additional_cost_per_moto
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'container_offloads' AND column_name = 'additional_cost_per_bale'
  ) THEN
    ALTER TABLE container_offloads RENAME COLUMN additional_cost_per_bale TO additional_cost_per_moto;
  END IF;
END $$;

-- 4. Per-employee per-location moto bonus rate (per-unit dollar rate)
CREATE TABLE IF NOT EXISTS employee_moto_rates (
  id serial PRIMARY KEY,
  employee_id integer NOT NULL,
  location_id integer NOT NULL,
  source_company_id integer,
  rate decimal(15, 4) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS employee_moto_rates_employee_idx ON employee_moto_rates (employee_id);

-- 5. Per-employee per-location moto bonus % (% of sales amount)
CREATE TABLE IF NOT EXISTS employee_moto_pct_rates (
  id serial PRIMARY KEY,
  employee_id integer NOT NULL,
  location_id integer NOT NULL,
  source_company_id integer,
  pct decimal(15, 4) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS employee_moto_pct_rates_employee_idx ON employee_moto_pct_rates (employee_id);
