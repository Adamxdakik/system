-- Program 4B correction: one finalized invoice may legitimately contain multiple motorcycles.
-- Keep one voucher link per motorcycle, but allow several motorcycle rows to reference the same voucher.

DROP INDEX IF EXISTS bike_purchases_company_sale_voucher_unique;

CREATE INDEX IF NOT EXISTS bike_purchases_company_sale_voucher_idx
  ON bike_purchases (company_id, sale_voucher_id)
  WHERE sale_voucher_id IS NOT NULL
    AND deleted_at IS NULL;
