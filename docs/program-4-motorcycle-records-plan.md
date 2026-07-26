# Program 4 — Individual Motorcycle Records

## Goal

Make every motorcycle a first-class, individually traceable business record from import and stock through reservation, sale, warranty, service, and assembly history.

The motorcycle registry must use engine and chassis numbers as durable identifiers while preserving existing customer purchase and workshop history.

## Permanent constraints

- Keep all records company-scoped.
- Do not change accounting posting, inventory valuation, POS totals, or container costing as part of Phase 4A.
- Preserve existing customer, service, warranty, communication, assembly, supplier, container, and location routes.
- Keep legacy `bike_purchases` rows readable; missing registry details on historical rows must not block migration.
- Engine and chassis numbers must be unique within each company for active records.
- A motorcycle may exist before it is sold. Sold motorcycles require a customer and sale date.
- Use soft deletion so operational history is not destructively erased.
- Do not merge any Program 4 work until its full diff and permanent CI validation are reviewed.

## Phase 4A — Motorcycle registry

### Scope

- individual motorcycle data model and migration
- company-scoped motorcycle API
- motorcycle list, search, filters, summary counts, create, edit, and soft removal
- navigation and route integration

### Fields

- brand and model
- colour and model year
- engine number and chassis number
- purchase cost and selling price
- current location and lifecycle status
- supplier and source container
- customer, sale date, and invoice number
- warranty dates and operational notes

### Acceptance

- Users can register an unsold motorcycle without inventing a customer or sale date.
- Every new record requires engine and chassis numbers.
- Duplicate engine or chassis numbers within the same company are refused.
- Cross-company customer, location, supplier, and container references are refused.
- Sold records require a customer and sale date.
- Existing accounting and stock behaviour is unchanged.

## Phase 4B — Sales and customer linkage

### Planned scope

- select an existing in-stock motorcycle during motorcycle sales
- change lifecycle status through an explicit sale workflow
- link the sold unit to its customer, invoice, date, price, and warranty
- prevent the same motorcycle from being sold twice
- preserve the existing POS and accounting transaction boundaries

### Acceptance

- Finalized motorcycle sales update the individual unit exactly once.
- Draft or failed sales do not change motorcycle ownership or status.
- Corrections and cancellations follow the finalized-document safeguards established in Program 2.

## Phase 4C — Workshop and assembly lifecycle

### Planned scope

- select registered motorcycles in service and warranty records
- show a unified motorcycle timeline for sale, warranty, service, communication, and assembly events
- connect completed assembly output to the individual motorcycle registry where applicable
- add operational lifecycle filters and exception indicators

### Acceptance

- Workshop users can locate a motorcycle by engine or chassis number.
- Service and warranty history remains company- and customer-scoped.
- Assembly and workshop linkage does not mutate accounting or stock outside existing approved flows.

## Definition of done for Phase 4A

Phase 4A is complete only after the migration chain is idempotent, formatting and lint pass with zero warnings, package and whole-application TypeScript checks pass, CI-safe tests and production build pass, and all permanent PostgreSQL financial, payroll, stock, container, POS-value, report, and audit regressions remain green.
