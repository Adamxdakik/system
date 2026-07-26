# Program 3 — Simplified Interface

## Goal

Make the ERP faster and easier for daily users by simplifying navigation, dashboard hierarchy, inventory/product workflows, and sale/purchase forms without changing business rules, calculations, permissions, accounting behavior, inventory valuation, or API contracts.

## Permanent constraints

- Preserve all existing routes, authorization checks, calculations, posting behavior, and inventory rules.
- Do not modify database schema, migrations, accounting services, stock valuation, or container costing as part of this program.
- Reuse already-fetched data. Interface simplification must not introduce duplicate or unbounded API calls.
- Keep advanced information available through progressive disclosure rather than deleting it.
- Advanced bale/product detail is collapsed by default and remains explicitly accessible.
- Desktop and mobile behavior must both remain usable; wide data tables scroll inside their card instead of forcing body-level horizontal scrolling.
- Each phase stays on this branch and draft PR. Do not merge until the full Program 3 diff is audited and approved.

## Phase 3A — Shell, navigation, and dashboard

### Scope

- `client/src/config/navigation.ts`
- `client/src/components/AppSidebar.tsx`
- dashboard components and existing dashboard data presentation
- shared page-header and quick-action presentation where already available

### Work

- Reduce navigation scanning effort through clearer daily-work labels and grouping.
- Keep high-frequency actions visible and secondary/admin destinations collapsed.
- Simplify dashboard visual hierarchy so the most important operational totals and actions appear first.
- Remove duplicated presentation while preserving every authoritative metric and its source.
- Keep the current permission filtering and route matching unchanged.

### Acceptance

- Existing users retain access to every route allowed by their role.
- No route, permission, metric formula, or API request contract changes.
- Dashboard primary actions and key totals are understandable without scanning the full page.
- Navigation works in expanded, collapsed, and mobile drawer states.

## Phase 3B — Inventory and product workflow

Implementation is complete on draft PR #4.

### Scope

- stock and inventory list pages
- product/item create and edit forms
- filters, search, row actions, and detail sections

### Work

- Prioritize common stock fields and actions.
- Consolidate redundant filters and make active filters obvious.
- Keep advanced product/bale information collapsed by default.
- Preserve exact quantities, rates, values, grouping, aliases, and location behavior.
- Improve empty, loading, and error states without adding new data sources.

### Acceptance

- Users can find, create, and edit an item with fewer visual decisions.
- Existing stock data and calculations display unchanged.
- Advanced details remain available and editable where currently permitted.
- No new API calls are introduced solely for alternative presentation.

## Phase 3C — Sale and purchase forms

Implementation, cleanup, and permanent CI validation are complete on draft PR #4.

### Scope

- sale/POS entry presentation
- purchase-order and receiving form presentation
- totals, validation feedback, actions, and advanced sections

### Work

- Keep the primary entry flow visible and move uncommon fields into clearly labeled advanced sections.
- Improve line-item readability, totals hierarchy, validation messages, and save/finalize actions.
- Preserve all pricing, currency, stock, posting, approval, and reversal behavior.
- Do not change transaction boundaries or finalized-document rules established by Program 2.

### Acceptance

- Existing valid transactions produce identical domain and accounting results.
- Required fields and validation failures are clear before submission.
- Advanced fields remain accessible without overwhelming the normal flow.
- Draft, save, finalize, edit, correction, and cancellation permissions remain unchanged.

## Definition of done

Program 3 is complete on draft PR #4. The final source-only head passed formatting, zero-warning lint, package and whole-application TypeScript checks, CI-safe tests, production build, the full migration chain with idempotent rerun, and all permanent PostgreSQL accounting, payroll, stock, container, POS-value, report, and audit regressions.
