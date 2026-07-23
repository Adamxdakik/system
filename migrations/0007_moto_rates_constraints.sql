-- Pass D follow-up: harden the moto-rates tables with foreign keys and a uniqueness
-- constraint to prevent orphans/dupes. Idempotent: safe to re-run.

-- 0. Clean any orphan rows that would block FK creation (defensive — none expected
--    in production since the tables are new and replace-all PUT prevents dupes).
DELETE FROM employee_moto_rates
  WHERE employee_id NOT IN (SELECT id FROM employees);
DELETE FROM employee_moto_rates
  WHERE location_id NOT IN (SELECT id FROM locations);
DELETE FROM employee_moto_rates AS r1
  USING employee_moto_rates AS r2
  WHERE r1.employee_id = r2.employee_id
    AND r1.location_id = r2.location_id
    AND r1.id < r2.id;

DELETE FROM employee_moto_pct_rates
  WHERE employee_id NOT IN (SELECT id FROM employees);
DELETE FROM employee_moto_pct_rates
  WHERE location_id NOT IN (SELECT id FROM locations);
DELETE FROM employee_moto_pct_rates AS r1
  USING employee_moto_pct_rates AS r2
  WHERE r1.employee_id = r2.employee_id
    AND r1.location_id = r2.location_id
    AND r1.id < r2.id;

-- 1. employee_moto_rates: FKs + UNIQUE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employee_moto_rates_employee_fk'
  ) THEN
    ALTER TABLE employee_moto_rates
      ADD CONSTRAINT employee_moto_rates_employee_fk
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employee_moto_rates_location_fk'
  ) THEN
    ALTER TABLE employee_moto_rates
      ADD CONSTRAINT employee_moto_rates_location_fk
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employee_moto_rates_emp_loc_unique'
  ) THEN
    ALTER TABLE employee_moto_rates
      ADD CONSTRAINT employee_moto_rates_emp_loc_unique UNIQUE (employee_id, location_id);
  END IF;
END $$;

-- 2. employee_moto_pct_rates: FKs + UNIQUE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employee_moto_pct_rates_employee_fk'
  ) THEN
    ALTER TABLE employee_moto_pct_rates
      ADD CONSTRAINT employee_moto_pct_rates_employee_fk
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employee_moto_pct_rates_location_fk'
  ) THEN
    ALTER TABLE employee_moto_pct_rates
      ADD CONSTRAINT employee_moto_pct_rates_location_fk
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employee_moto_pct_rates_emp_loc_unique'
  ) THEN
    ALTER TABLE employee_moto_pct_rates
      ADD CONSTRAINT employee_moto_pct_rates_emp_loc_unique UNIQUE (employee_id, location_id);
  END IF;
END $$;
