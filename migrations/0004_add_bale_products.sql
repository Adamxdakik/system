-- Create bale_products table for product master data
CREATE TABLE IF NOT EXISTS "bale_products" (
  "id" serial PRIMARY KEY NOT NULL,
  "company_id" integer NOT NULL,
  "code" varchar(50) NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "bale_products_company_code_unique"
  ON "bale_products" ("company_id", "code");

-- Some historical migration chains create production_bales after this file.
-- Apply the alteration only when the table already exists; a later idempotent
-- migration repeats the alteration after the rest of the chain has run.
DO $$
BEGIN
  IF to_regclass('public.production_bales') IS NOT NULL THEN
    ALTER TABLE "production_bales" ADD COLUMN IF NOT EXISTS "product_id" integer;
    ALTER TABLE "production_bales" ALTER COLUMN "category" DROP NOT NULL;
    ALTER TABLE "production_bales" ALTER COLUMN "grade" DROP NOT NULL;
  END IF;
END $$;
