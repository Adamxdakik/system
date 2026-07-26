-- Complete deferred production_bales alterations after the migration chain.
-- This remains safe on installations that do not use the production_bales table.
DO $$
BEGIN
  IF to_regclass('public.production_bales') IS NOT NULL THEN
    ALTER TABLE "production_bales" ADD COLUMN IF NOT EXISTS "product_id" integer;
    ALTER TABLE "production_bales"
      ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 1 NOT NULL;
    ALTER TABLE "production_bales" ADD COLUMN IF NOT EXISTS "location_id" integer;
    ALTER TABLE "production_bales" ALTER COLUMN "category" DROP NOT NULL;
    ALTER TABLE "production_bales" ALTER COLUMN "grade" DROP NOT NULL;

    CREATE INDEX IF NOT EXISTS "production_bales_location_idx"
      ON "production_bales" ("location_id");

    UPDATE "production_bales"
    SET "quantity" = 1
    WHERE "quantity" IS NULL;
  END IF;
END $$;
