-- Complete the uniqueness rule deferred by the historical 0001 ordering.
DO $$
BEGIN
  IF to_regclass('public.container_sales') IS NOT NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS container_sales_company_container_unique
      ON container_sales (company_id, container_id);

    COMMENT ON INDEX container_sales_company_container_unique IS
      'Ensures each container can only be sold once per company, preventing duplicate sales';
  END IF;
END $$;
