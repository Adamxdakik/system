-- Program 4B: link an individual motorcycle to one finalized Sales voucher.

ALTER TABLE bike_purchases
  ADD COLUMN IF NOT EXISTS sale_voucher_id integer,
  ADD COLUMN IF NOT EXISTS sale_linked_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS sold_by_user_id varchar(255);

CREATE UNIQUE INDEX IF NOT EXISTS bike_purchases_company_sale_voucher_unique
  ON bike_purchases (company_id, sale_voucher_id)
  WHERE sale_voucher_id IS NOT NULL
    AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS bike_purchases_sale_voucher_idx
  ON bike_purchases (sale_voucher_id)
  WHERE sale_voucher_id IS NOT NULL;
