-- Historical migration chains do not always create production_bales before
-- this file. Apply now when possible; migration 0015 repeats the operation.
DO $$
BEGIN
  IF to_regclass('public.production_bales') IS NOT NULL THEN
    ALTER TABLE "production_bales"
      ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 1 NOT NULL;
    ALTER TABLE "production_bales"
      ADD COLUMN IF NOT EXISTS "location_id" integer;

    CREATE INDEX IF NOT EXISTS "production_bales_location_idx"
      ON "production_bales" ("location_id");

    UPDATE "production_bales"
    SET "quantity" = 1
    WHERE "quantity" IS NULL;
  END IF;
END $$;
