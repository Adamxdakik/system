# MotoTrack ERP/POS — HuangHe Motors (HHM)

## Overview

MotoTrack is a comprehensive ERP and POS system designed for HuangHe Motors (HHM), a motorcycle import and distribution company in the DRC. Its primary purpose is to manage multi-location inventory, streamline container-based purchasing, handle full double-entry financial accounting, process payroll, and manage supplier and customer relationships. Key capabilities include tracking motorcycle assembly and maintaining after-sales service records. The system supports multiple companies with isolated data, role-based access control, and a dedicated administration panel for system management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript and Vite.
- **Routing**: Client-side routing using `wouter`.
- **State Management**: TanStack Query for server state and React hooks/context for local UI state.
- **Forms**: `react-hook-form` integrated with Zod and `drizzle-zod` for validation.
- **UI/UX**: Utilizes shadcn/ui (New York style) built on Radix UI primitives, styled with Tailwind CSS. Fonts include Inter and JetBrains Mono.
- **Theming**: Supports light and dark modes via `ThemeProvider`.
- **Performance**: Pages are lazy-loaded using `React.lazy()` with `<Suspense>` for fallback spinners.
- **Error Handling**: A class-based `<ErrorBoundary>` component wraps the router for robust error management.
- **User Experience**: Includes an `<OfflineBanner>` for network status and a `<CommandPalette>` (Ctrl+K / Cmd+K) for quick navigation.

### Backend

- **Server**: Developed with Express.js and TypeScript.
- **API**: Provides RESTful endpoints, secured with `requireAuth` middleware and validated using Zod.
- **Sessions**: PostgreSQL-backed session management via `connect-pg-simple`, using the cookie name `erp.session`.
- **Build**: Vite is used for the client build, and `esbuild` for the server, with custom Vite/HMR dev integration.

### Database

- **Engine**: PostgreSQL, accessed via a `DATABASE_URL` environment variable.
- **ORM**: Drizzle ORM with `drizzle-kit` for schema migrations.
- **Schema**: A single `shared/schema.ts` file acts as the source of truth for types across the stack.
- **Core Tables**: Key tables include `users`, `companies`, `locations`, `stock_items`, `vouchers`, `purchase_orders`, `ledger_accounts`, `employees`, `suppliers`, `customers`, and `session`.

### Key Features

- **Inventory**: Multi-location stock tracking with weighted average cost, container-based purchase orders, stock transfers, and production/consumption vouchers.
- **Financial Accounting**: Full double-entry voucher system (Sales, Purchase, Payment, Receipt, Journal, Contra, Stock Transfer, Production, Consumption), auto-generated vouchers for PO container offloads, ledger account hierarchy, and financial reports (Income Statement, Daybook, Opening/Closing Stock).
- **Point of Sale (POS)**: Restricted interface for POS roles, location-authenticated sessions, and barcode scanning support.
- **Partners & Service**: Management of suppliers and customers, including service history, warranty tracking, and communication logs.
- **Assembly**: Records for motorcycle assembly from component stock items.
- **Payroll**: Employee management and payroll voucher creation.
- **Settings (Admin-only)**: Comprehensive admin panel for managing companies, users, fiscal periods, system preferences, role permissions, active sessions, and database statistics.

## Recent Changes (2026-05-02)

### Hardening pass
- **Auth session bug fix**: `requireAuth` now returns `403 NO_COMPANY_SELECTED` (was `401`) when the user is logged in but has no company yet — this prevents the frontend from logging the user out. The `/api/auth/login` route now explicitly persists the session via `req.session.save()` before responding so the `Set-Cookie` header is guaranteed to land on the response.
- **Centralized error handling**: New `server/lib/asyncHandler.ts` wrapper forwards rejected promises to Express's error pipeline. The error middleware in `server/index.ts` now handles `ZodError` → `400` with structured field errors, logs `5xx` responses, and includes optional `code` field on the JSON payload.
- **Zod input validation**: New `server/lib/validate.ts` middleware (`validate(schema, source)`) validates `body`/`query`/`params` and forwards `ZodError`s to the error middleware. Now applied to:
  - `POST /api/auth/login` (`loginSchema`)
  - `POST /api/suppliers` (`insertSupplierSchema`) + `PATCH /api/suppliers/:id` (`.partial()`)
  - `POST /api/employees` (`insertEmployeeSchema`)
  - `POST /api/customers` (`insertCustomerSchema.omit({companyId:true})` — companyId injected from session post-validate) + `PUT /api/customers/:id` (`.partial()`)
  - `POST /api/stock-items` (`insertStockItemSchema.omit({companyId:true})`)
  All validated routes now also use `asyncHandler` and surface structured error codes (`DUPLICATE_CODE`, `NO_COMPANY_SELECTED`, `WRONG_COMPANY`) for clients that want to handle them programmatically.
- **xlsx → exceljs migration (complete)**: The unmaintained `xlsx` package (prototype-pollution + ReDoS CVEs, no fix) and the `xlsx-js-style` follow-on have **both** been replaced. Most call sites use the SheetJS-shaped shims in `server/lib/excel.ts` and `client/src/lib/excelHelper.ts` (`XLSX.utils.book_new`, `json_to_sheet`, `aoa_to_sheet`, `book_append_sheet`, `sheet_to_json`, `XLSX.read`, `XLSX.write`, `XLSX.writeFile`); only difference is that read/write are async (call sites now `await`). `client/src/components/ERPRunPayroll.tsx` `exportRunExcel()` was rewritten to use the native `exceljs` API directly (column widths, merged title row, bold header, currency `numFmt`, blob download). Result: zero `xlsx`-family packages remain in the dependency tree.
- **Tooling**: Added `eslint.config.js` (flat config: typescript-eslint + react-hooks + react-refresh + `eslint-plugin-unused-imports` for autofixable dead imports), `.prettierrc.json`, `vitest.config.ts`. New scripts: `lint`, `lint:fix`, `format`, `format:check`, `test`, `test:watch`. Vitest tests cover `asyncHandler`, `validate()` (success / ZodError forwarding / query+params sources), and excel-shim parity (json_to_sheet/aoa_to_sheet round-trip + multi-sheet preservation). 0 ESLint errors. Unused-var warnings: 301 → 178 after `eslint --fix` (-41%); remaining are mostly unused arguments + intentionally-unused destructure targets that need human review.
- **Dependency cleanup**: Removed unused `passport`, `passport-local`, `memorystore`, `tw-animate-css`, the deprecated `xlsx` package itself, and `xlsx-js-style` (replaced by exceljs in payroll export).
- **Security scan baseline (post-hardening)**:
  - Dependency audit: 0 critical / 0 high / 4 moderate (dev-only: esbuild GHSA-67mh-4wv8-2f99 in transitive vite/drizzle-kit chains; uuid 8.x via exceljs). All require dev server to be reachable to exploit.
  - SAST: 0 critical / 0 high (7 medium, 2 low).
  - HoundDog: 0 critical / 0 high (2 medium, 4 low). The previous CRITICAL "Password sent to Standard Output" in `scripts/create-admin.ts` was fixed by writing the initial admin credential to a chmod-0600, gitignored file (`.admin-credentials.txt`) instead of stdout.
- **House cleaning**: Deleted `_trash/` (~112MB).

### Bale-trading dead-code cleanup (Pass A + B)
- **Pass A — deleted** all unused bale-trading infrastructure inherited from the prior project:
  - Routes: `/api/bales`, `/api/bale-products`, `/api/production-bales`, `/api/bale-transfers`, `/api/bales-by-location` (3 blocks ≈ 820 lines from `server/routes.ts`).
  - Storage methods + interface entries for bales/bale-products/bale-transfers/production-bales (~490 lines from `server/storage.ts`), including the `deleteCompany` cleanup blocks that referenced those tables.
  - Schema tables: `bales`, `baleProducts`, `baleSequences`, `productionBales`, `baleTransfers`, `baleTransferItems` (~130 lines from `shared/schema.ts`). `mixBatches` / `mixBatchSources` retained.
  - Files removed: `client/src/lib/factoryApi.ts`, `client/src/contexts/AppModeContext.tsx`. `<AppModeProvider>` wrapper removed from `App.tsx`.
  - In `Accounts.tsx` / `Payroll.tsx` / `Vouchers.tsx`: replaced `useAppMode()` + `getApiRequest(appMode)` with hardcoded `appMode: string = "erp"` + direct `apiRequest`. Existing `appMode === "factory"` conditionals left as harmless dead branches.
- **Pass B — renamed** live UI labels from "Bale" → "Moto" / "Unit":
  - `OffloadDetail.tsx`: "Total Bales" → "Total Motos", "Additional Cost / Bale" → "Additional Cost / Moto".
  - `StockTransferOrder.tsx`: "X bales" → "X units", "Total Bales:" → "Total Units:".
  - `Payroll.tsx` bonus tab: "Bales / Units" → "Motos / Units", "Bales Rate ($/unit)" → "Motos Rate ($/unit)", "Bale Bonus Rates by Location" → "Moto Bonus Rates by Location", "Bales % by Location" → "Motos % by Location".
- **Pass C — schema renames + missing endpoints** (idempotent migration):
  - DB column renames: `employees.bales_bonus_rate` → `motos_bonus_rate`, `container_offloads.total_bales` → `total_motos`, `container_offloads.additional_cost_per_bale` → `additional_cost_per_moto`. Drizzle field names also renamed (`balesBonusRate` → `motosBonusRate`, etc.) across `shared/schema.ts`, `server/storage.ts`, `server/routes.ts`, `client/src/pages/Payroll.tsx`, `Daybook.tsx`, `OffloadDetail.tsx`. (Local-only `totalBales` sum variable in `StockTransferOrder.tsx` left as-is since it counts mixed parts/motos for a transfer order.)
  - 4 new endpoints — fixes the previously-404 per-location bale-rates UI in Payroll:
    - GET/PUT `/api/employees/:id/moto-rates` — per-employee per-location moto bonus $/unit rate.
    - GET/PUT `/api/employees/:id/moto-pct-rates` — per-employee per-location moto bonus % of sales amount.
    - All 4 use `requireAuth` + tenant-scope check (employee must belong to `req.session.currentCompanyId`). PUT uses replace-all semantics inside `db.transaction`.
  - 2 new tables: `employee_moto_rates` and `employee_moto_pct_rates` (id, employee_id, location_id, source_company_id, rate|pct, created_at, updated_at).
  - **Migration deployment**: Added explicit SQL migration `migrations/0006_bale_to_moto_pass_c.sql` (fully idempotent — `DO $$ IF EXISTS` blocks for column renames, `CREATE TABLE IF NOT EXISTS` for new tables). New `scripts/migrate.ts` runs all SQL files >= `0006` and tracks them in `_idempotent_migrations` table. Added `npm run db:migrate` script. Updated `render.yaml` `buildCommand` to `npm install --production=false && npm run build && npm run db:migrate && npm run db:push` so Render auto-applies the migration on every deploy. (`db:push` continues to handle schema deltas that don't need explicit SQL.)
  - Frontend `Payroll.tsx` API call sites updated to `/moto-rates` / `/moto-pct-rates`. Local state variable names like `editBaleRates` / `setBalesRows` left unchanged (internal-only, no functional impact).

### Pass D — production safety + regression coverage
- **Schema sanity script** (`scripts/verify-moto-schema.ts`, run via `npm run db:verify-moto-schema`): asserts the 3 required moto columns + 2 required moto tables exist AND the 3 stale "bale" columns are absent. Exits 1 with a clear failure list if any check fails. Wired into the Render build between `db:migrate` and `db:push`, so a deploy now refuses to start if the migration didn't run cleanly. New buildCommand: `npm install --production=false && npm run build && npm run db:migrate && npm run db:verify-moto-schema && npm run db:push`.
- **HTTP regression tests** (`server/__tests__/moto-rates-routes.test.ts`, 6 tests): hits the running dev server (port 5000) and asserts (a) all 4 new endpoints — GET/PUT `/api/employees/:id/moto-rates` and `/api/employees/:id/moto-pct-rates` — return 401 JSON `{message}` (proves they're registered + auth-gated), and (b) the old `/bale-rates` and `/bale-pct-rates` paths return non-JSON content (SPA fallback HTML, proving they're not re-registered as API routes).
- **Storage regression tests** (`server/__tests__/moto-rates-storage.test.ts`, 6 tests): drives `storage.replaceEmployeeMotoRates` / `replaceEmployeeMotoPctRates` directly using synthetic negative `employee_id`s (well outside any real range) with `beforeAll`/`afterAll` cleanup. Covers (a) initial insert, (b) replace-all semantics on subsequent PUT, (c) clearing via empty array, (d) per-employee isolation (saving for emp B doesn't touch emp A), (e) `sourceCompanyId` preserved when set / null otherwise.
- **Empty-state copy** (`Payroll.tsx`): "No per-location rates configured." → "No moto rates configured yet." (and similarly for the % rates dialog). Internal state names like `editBaleRates`, `setBalesRows`, `bonusTab="bales"`, `data-testid="..."` left as-is per scoping rule (non-user-facing).
- **Manual verification commands**:
  - `npm run db:verify-moto-schema` — run anytime to confirm schema is in sync.
  - `npx vitest run server/__tests__/moto-rates-routes.test.ts server/__tests__/moto-rates-storage.test.ts` — run the 12 new regression tests (requires the dev workflow on port 5000 for the routes test).
  - `npm run db:migrate` — re-apply idempotent SQL migrations to a target DB.
  - `psql -c "SELECT * FROM _idempotent_migrations"` — inspect which migrations have been applied.

### Simplified accounting UX (no debit/credit jargon)
- **New endpoints** (in `server/routes.ts`): `POST /api/accounts/transfer` writes a balanced 2-line `Payment` voucher (Debit destination, Credit source). `POST /api/accounts/adjust` writes a balanced 2-line `Journal` voucher with the opposite leg routed to a per-tenant `MANUAL_ADJ` "Manual Adjustments" suspense ledger (Equity, lazily auto-created via `getOrCreateManualAdjustmentsAccount`, race-safe via 23505 retry). Both endpoints `requireAuth` + `requireNonPOS`, are tenant-scoped (`verifyAccountOwnership`), wrap voucher header + both legs in a single `db.transaction(...)` for atomic balance integrity, and keep employee `currentBalance` cache in sync.
- **Daybook hides system entries by default**: `GET /api/vouchers` accepts `?includeSystem=false` which filters out auto-generated voucher types (Sales, Purchase, Stock Transfer, Closing, Production, Consumption). `client/src/pages/Daybook.tsx` ships this filter on by default with a "Show automatic entries" toggle (`<Switch>`). Trial Balance / Balance Sheet / Income Statement still consume the full voucher set so they keep balancing.
- **Tenant-isolation fix (drive-by)**: `storage.getVouchersByDateRange` now accepts an optional `companyId` and the `/api/vouchers` route always passes the session companyId — closes a cross-tenant date-range data leak that pre-existed before this work.
- **Frontend**: `client/src/components/QuickTransferDialog.tsx` (From/To/Amount/Date/Notes, grouped Select with plain "have/owe" labels) and `QuickAdjustDialog.tsx` (Account/Increase|Decrease/Amount/Date/Reason). Wired into `client/src/pages/Accounts.tsx` header as `Adjust Balance` + `Pay / Receive` buttons next to the existing Create button. Customers (no `customer_id` column on `voucher_entries`) and factory accounts are intentionally excluded from the quick dialogs; existing flows handle them.

## External Dependencies

- **UI Libraries**: Radix UI, Tailwind CSS, shadcn/ui, `cmdk`.
- **Charting**: `recharts`.
- **Date Handling**: `date-fns`, `react-day-picker`.
- **Carousel**: `embla-carousel-react`.
- **Database Drivers/Tools**: `pg` (node-postgres), `drizzle-orm`, `drizzle-kit`, `connect-pg-simple`.
- **Form Management/Validation**: `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-zod`.
- **Spreadsheet Export**: `xlsx`.
- **Build Tools**: Vite, `esbuild`, PostCSS, Autoprefixer.
- **AI Integration**: Google Gemini API (admin-controlled access).