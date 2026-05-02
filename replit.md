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