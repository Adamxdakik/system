# Program 1B ERP permission fallback

`role_feature_permissions` remains the authoritative page-access source for
Owner, Manager, and POS roles in the current company.

When a role has stored rows, only enabled feature keys are returned. POS rows
are additionally intersected with the existing POS-safe page set.

For companies without stored rows, the compatibility fallback mirrors the
existing sidebar behavior:

- Owner and Manager receive all current feature keys except `settings`.
- POS roles receive only POS, POS daybook, location inventory, suppliers,
  customers, vouchers, daybook, and sales report.
- Unknown roles receive no page keys.

The current schema has no stored hidden-cost-field permission model, so
`hiddenErpCostFields` remains an empty array until such a model exists.
