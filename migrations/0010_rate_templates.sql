-- C1: rate templates — named bundles of (locationId, rate, pct) that can be
-- applied to one or many employees in a single click. Owned by a company.
CREATE TABLE IF NOT EXISTS rate_templates (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,
  UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS rate_template_items (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES rate_templates(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  rate NUMERIC(12, 4),
  pct NUMERIC(7, 4),
  source_company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (rate IS NOT NULL OR pct IS NOT NULL),
  UNIQUE (template_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_rate_templates_company ON rate_templates(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rate_template_items_template ON rate_template_items(template_id);
