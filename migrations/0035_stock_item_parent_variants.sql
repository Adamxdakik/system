-- Add the nullable parent relationship used by stock-item variants.
-- Existing stock items remain standalone because the new column defaults to NULL.
ALTER TABLE stock_items
  ADD COLUMN IF NOT EXISTS parent_stock_item_id integer;

CREATE INDEX IF NOT EXISTS stock_items_parent_stock_item_id_idx
  ON stock_items (parent_stock_item_id);
