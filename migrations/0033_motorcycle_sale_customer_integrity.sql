-- Program 4B: keep every motorcycle linked to one finalized invoice under the same customer.
-- The advisory transaction lock also protects concurrent links to a new cash-sale invoice.

CREATE OR REPLACE FUNCTION enforce_motorcycle_sale_customer_integrity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  expected_customer_id integer;
BEGIN
  IF NEW.sale_voucher_id IS NULL OR NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(NEW.company_id, NEW.sale_voucher_id);

  SELECT COALESCE(ve.customer_id, ledger_customer.id)
  INTO expected_customer_id
  FROM voucher_entries ve
  LEFT JOIN customers ledger_customer
    ON ledger_customer.ledger_account_id = ve.ledger_account_id
    AND ledger_customer.company_id = NEW.company_id
    AND ledger_customer.deleted_at IS NULL
  WHERE ve.voucher_id = NEW.sale_voucher_id
    AND ve.debit_amount > 0
    AND (ve.customer_id IS NOT NULL OR ledger_customer.id IS NOT NULL)
  ORDER BY ve.id
  LIMIT 1;

  IF expected_customer_id IS NULL THEN
    SELECT linked.customer_id
    INTO expected_customer_id
    FROM bike_purchases linked
    WHERE linked.company_id = NEW.company_id
      AND linked.sale_voucher_id = NEW.sale_voucher_id
      AND linked.customer_id IS NOT NULL
      AND linked.id IS DISTINCT FROM NEW.id
      AND linked.deleted_at IS NULL
    ORDER BY linked.id
    LIMIT 1;
  END IF;

  IF expected_customer_id IS NOT NULL
    AND NEW.customer_id IS DISTINCT FROM expected_customer_id THEN
    RAISE EXCEPTION USING
      ERRCODE = '23514',
      MESSAGE = 'Customer must match the finalized Sales voucher';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bike_purchases_sale_customer_integrity
  ON bike_purchases;

CREATE TRIGGER bike_purchases_sale_customer_integrity
BEFORE INSERT OR UPDATE OF company_id, customer_id, sale_voucher_id, deleted_at
ON bike_purchases
FOR EACH ROW
EXECUTE FUNCTION enforce_motorcycle_sale_customer_integrity();
