# Program 4 — Individual Motorcycle Records

## Goal

Make every motorcycle a first-class, individually traceable business record from import and stock through reservation, sale, warranty, service, and assembly history.

The motorcycle registry must use engine and chassis numbers as durable identifiers while preserving existing customer purchase and workshop history.

## Permanent constraints

- Keep all records company-scoped.
- Do not change accounting posting, inventory valuation, POS totals, or container costing through motorcycle lifecycle work.
- Preserve existing customer, service, warranty, communication, assembly, supplier, container, and location routes.
- Keep legacy `bike_purchases` rows readable; missing registry details on historical rows must not block migration.
- Engine and chassis numbers must be unique within each company for active records.
- A motorcycle may exist before it is sold. Sold motorcycles require a customer and sale date.
- Use soft deletion so operational history is not destructively erased.
- Do not merge any Program 4 work until its full diff and permanent CI validation are reviewed.

## Phase 4A — Motorcycle registry

### Completed scope

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

### Completed scope

- link an in-stock or reserved motorcycle to an existing finalized Sales voucher
- infer and lock the customer from credit-sale voucher entries or motorcycles already linked to the same invoice; require an explicit customer for a new cash-sale invoice
- reset the customer selection whenever the operator changes the selected voucher
- copy the finalized voucher number and date into the motorcycle sale record
- save the motorcycle-specific selling price and warranty dates
- lock customer, sale date, invoice, selling price, status, and deletion after linking
- allow multiple motorcycles on one finalized invoice while capping their combined linked prices at the voucher total
- enforce one customer per finalized invoice with a PostgreSQL transaction-level advisory lock and trigger
- require the linked Sales voucher to be formally reversed before an administrator can release the motorcycle
- preserve the existing POS, inventory, and accounting transaction boundaries without reposting financial or stock movement

### Acceptance

- Finalized motorcycle sales update the individual unit exactly once.
- Draft, optional, deleted, reversed, and reversal vouchers cannot be linked.
- The same motorcycle cannot be sold twice, and combined motorcycle prices cannot exceed the finalized voucher total.
- Cross-company customers and mismatched locations are refused.
- A finalized invoice's identified customer cannot be replaced during motorcycle linking.
- Concurrent links to the same cash-sale invoice cannot assign different customers.
- Manual edits cannot invent or erase a finalized motorcycle sale.
- Corrections and cancellations follow the finalized-document safeguards established in Program 2.

## Phase 4C — Workshop and assembly lifecycle

### Completed scope

- link service, warranty, and communication records to an individual registered motorcycle
- keep existing customer service-center and historical free-text records compatible
- show a unified timeline for registry, sale, warranty, service, communication, and assembly events
- register completed Final Product assembly output as individual motorcycles without changing aggregate inventory
- cap registrations at completed output quantity and prevent reopening linked completed output
- add lifecycle counts, exception indicators, and operational filters to the motorcycle registry
- lock motorcycle removal after workshop or assembly history exists

### Acceptance

- Workshop users can locate a motorcycle by engine or chassis number and open its complete lifecycle.
- New service, warranty, and communication records remain company- and customer-scoped.
- Completed assembly output can create only the number of individual units recorded as completed.
- Assembly and workshop linkage does not create, reverse, or mutate accounting or stock movements.
- Existing customer, workshop, warranty, communication, and assembly pages remain compatible.

## Definition of done for Phases 4A–4C

Phases 4A–4C are complete only after the migration chain is idempotent, formatting and lint pass with zero warnings, package and whole-application TypeScript checks pass, CI-safe tests and production build pass, and all permanent PostgreSQL financial, payroll, stock, container, POS-value, report, and audit regressions remain green.
