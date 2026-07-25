-- Complete the deferred production_bales alteration after the migration chain.
-- This remains safe on installations that do not use the production_bales table.
DO $$
BEGIN
  IF to_regclass('public.production_bales') IS NOT NULL THEN
    ALTER TABLE "production_bales" ADD COLUMN IF NOT EXISTS "product_id" integer;
    ALTER TABLE "production_bales" ALTER COLUMN "category" DROP NOT NULL;
    ALTER TABLE "production_bales" ALTER COLUMN "grade" DROP NOT NULL;
  END IF;
END $$;
