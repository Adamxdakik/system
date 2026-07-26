-- Performance indexes identified in audit (issue #2)
-- All use IF NOT EXISTS so safe to run multiple times

-- voucher_entries(voucher_id) — used in virtually every finance query
CREATE INDEX IF NOT EXISTS idx_voucher_entries_voucher_id
  ON voucher_entries (voucher_id);

-- inventory composite — hit on every sale and stock update
CREATE INDEX IF NOT EXISTS idx_inventory_location_stock
  ON inventory (location_id, stock_item_id);

-- vouchers(voucher_date) — hit on every filtered report
CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_date
  ON vouchers (voucher_date);

-- stock_item_code_aliases(stock_item_id)
CREATE INDEX IF NOT EXISTS idx_stock_item_code_aliases_stock_item_id
  ON stock_item_code_aliases (stock_item_id);
