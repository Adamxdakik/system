-- Create container_offloads if it doesn't exist
CREATE TABLE IF NOT EXISTS container_offloads (
  id SERIAL PRIMARY KEY,
  container_id INTEGER NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id),
  duties NUMERIC(20, 2) NOT NULL DEFAULT '0',
  office_charges NUMERIC(20, 2) NOT NULL DEFAULT '0',
  transfer_charges NUMERIC(20, 2) NOT NULL DEFAULT '0',
  transport_fees NUMERIC(20, 2) NOT NULL DEFAULT '0',
  total_charges NUMERIC(20, 2) NOT NULL DEFAULT '0',
  total_motos NUMERIC(15, 3) NOT NULL DEFAULT '0',
  additional_cost_per_moto NUMERIC(20, 2) NOT NULL DEFAULT '0',
  offloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create offload_items if it doesn't exist
CREATE TABLE IF NOT EXISTS offload_items (
  id SERIAL PRIMARY KEY,
  offload_id INTEGER NOT NULL REFERENCES container_offloads(id) ON DELETE CASCADE,
  stock_item_id INTEGER REFERENCES stock_items(id),
  stock_item_name TEXT,
  stock_item_code TEXT,
  quantity NUMERIC(15, 3) NOT NULL,
  rate NUMERIC(20, 2) NOT NULL,
  total_value NUMERIC(20, 2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_container_offloads_container_id ON container_offloads(container_id);
CREATE INDEX IF NOT EXISTS idx_offload_items_offload_id ON offload_items(offload_id);
