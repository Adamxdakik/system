# MotoTrack ERP/POS — HuangHe Motors (HHM)

## Overview

MotoTrack is a full-stack ERP and POS system built for HuangHe Motors (HHM), a motorcycle import and distribution business operating in the DRC. It handles multi-location inventory, container-based purchase orders, full double-entry financial accounting, payroll, supplier and customer management, motorcycle assembly tracking, and after-sales service records. The system supports multiple companies with fully isolated data, role-based access control, and a dedicated Admin panel for system management.

## User Preferences

Preferred communication style: Simple, everyday language.

## Business Context

- **Company**: HuangHe Motors (HHM), company id=1
- **Active Locations**: Depot Route Likasi (id=1), HQ Boulevard M'Siri (id=3)
- **Roles**: Admin, Owner, Manager, POS 1–6 (POS roles get a restricted POS-only interface)
- **Currency**: Congolese Franc (CDF) with multi-currency support
- **Stock UoM**: All stock items currently use `uom = "PCS"` in DB

## System Architecture

### Frontend

- **Framework**: React 18 + TypeScript + Vite
- **Routing**: `wouter` (client-side)
- **State Management**: TanStack Query (server state), React hooks/context (local UI state)
- **Forms**: `react-hook-form` + Zod + `drizzle-zod`
- **UI**: shadcn/ui (New York style) on Radix UI primitives, Tailwind CSS, Inter + JetBrains Mono fonts
- **Theme**: Light/dark mode via `ThemeProvider`
- **Lazy Loading**: All pages loaded via `React.lazy()` with `<Suspense>` fallback spinners
- **Error Handling**: `<ErrorBoundary>` class component wraps the Router in both layouts
- **Offline Detection**: `<OfflineBanner>` shows a fixed banner when the connection drops; green flash on reconnect
- **Command Palette**: `<CommandPalette>` (Ctrl+K / Cmd+K) for fast page navigation, 22 destinations grouped by section

### Backend

- **Server**: Express.js + TypeScript
- **API**: RESTful endpoints with Zod validation, all protected by `requireAuth` middleware
- **Sessions**: PostgreSQL-backed via `connect-pg-simple`, cookie name `erp.session`
- **Build**: Vite for client, `esbuild` for server; custom Vite/HMR dev integration

### Database

- **Engine**: PostgreSQL (Replit-managed, accessed via `DATABASE_URL`)
- **ORM**: Drizzle ORM with `drizzle-kit` for schema migrations (`npm run db:push`)
- **Schema file**: `shared/schema.ts` (single source of truth for types across the stack)
- **Key tables**: users, companies, locations, stock_items, stock_groups, vouchers, voucher_items, purchase_orders, containers, ledger_accounts, employees, suppliers, customers, bank_accounts, fixed_assets, assembly_records, service_records, session

## Recent GitHub Sync (March 2026)

The following files were fully synced to match the GitHub reference repo (`Adamxdakik/test`):

### New Files Created
- `client/src/contexts/CursorNavContext.tsx` — cursor-up/down navigation context used by PageHeader
- `client/src/contexts/AppModeContext.tsx` — ERP vs Factory mode context (app uses `mode="erp"`)
- `client/src/lib/factoryApi.ts` — `AppMode` type, `factoryApiRequest`, `getApiRequest` helpers
- `client/src/components/ExchangeRateInput.tsx` — exchange rate input with daily-rate initialization
- `client/src/components/PageHeader.tsx` — standard page header with Back/Home/cursor-nav buttons
- `client/src/pages/StockTransferOrder.tsx` — Stock Transfer Order form page (1223 lines)
- `client/src/components/vouchers/CreateAccountModal.tsx` — account creation modal for voucher tabs
- `client/src/components/vouchers/CreditNoteTab.tsx` — Credit Note tab (810 lines)

### Updated Files
- `client/src/pages/Vouchers.tsx` — fully replaced with 6159-line GitHub version (adds Payment, Receipt, Production/Consumption, Credit Note, Stock Transfer Order tabs; uses `useAppMode`, `useCurrencyContext`, `ExchangeRateInput`, `PageHeader`)
- `client/src/pages/stock-transfer.tsx` — replaced with 999-line GitHub version (adds `formatNumber`, Excel export)
- `client/src/components/vouchers/PaymentVoucherTab.tsx` — updated (adds `isFactoryCompany`, `onAutoCreateAccount`, `isEditMode`, `originalTotal` props)
- `client/src/components/vouchers/ReceiptVoucherTab.tsx` — updated (same new props as Payment)
- `client/src/components/vouchers/VoucherEntriesTable.tsx` — updated (adds factory auto-create, balance display)
- `client/src/components/AccountSidebar.tsx` — updated (adds `onCreateAccount`, `isFactoryCompany`, `onAutoCreateAccount`, `isAutoCreating` props; `Account` type now includes `"customer"` and `"factorySupplier"`)
- `client/src/components/AccountAutocomplete.tsx` — `CombinedAccount` type and `onChange` type now include `"customer"` union member
- `client/src/contexts/CompanyContext.tsx` — `Company` interface now includes optional `companyType?: string`
- `client/src/App.tsx` — added `AppModeProvider`/`CursorNavProvider` to provider tree; added lazy `StockTransferOrderPage` import; added `/stock-transfer-order` route

## Key Features

### Inventory & Stock
- Multi-location stock tracking with weighted average cost
- Container-based purchase orders with freight and charge allocation
- Stock transfers, production/consumption vouchers
- Stock query with per-item history and monthly location summaries
- Soft delete on stock items with admin restore/purge

### Financial Accounting
- Full double-entry voucher system: Sales, Purchase, Payment, Receipt, Journal, Contra, Stock Transfer, Production, Consumption
- Auto-generated vouchers for PO container offloads and charges
- Ledger account hierarchy with monthly summaries and drill-down
- Income Statement (P&L), Daybook, Opening/Closing Stock reports
- Optional (draft) vouchers excluded from all calculations until toggled live
- Opening balances signed correctly by `openingBalanceSide` (Dr/Cr)

### Daybook Page (ERP mode — GitHub-synced)
- **Period Filter**: `PeriodFilter` component with presets: Today / This Month / Last 1 Month / Last 6 Months / This Year / All Time + custom date range picker
- **Date navigation**: keyboard `-` (back 1 day) / `Shift++` (forward 1 day) when no dialog is open
- **Sort toggle**: Newest First ↔ Oldest First via `sortOrder` filter
- **Hidden rows**: eye/eye-off button to show/hide individual vouchers; `Ctrl+H` to toggle show-hidden mode
- **Combined view**: Vouchers + Container Offloads displayed together, sorted by date
- **Session persistence**: `sessionStorage` saves period filter, filters, selected row, hidden rows, scroll position; restores on back-navigation from voucher flow
- **Keyboard navigation**: `↑↓` moves selected row (Ctrl+Up/Down for large jumps), `Enter` opens a voucher/offload, shortcuts gated by `hasAnyOpenDialog()`
- **View dialog**: shows DR/CR entries with running balance; Sales items show qty/rate/profit (hidden for POS); Purchase shows PO data with charges; keyboard `↑↓` navigates sales items, `Alt+S` opens stock query
- **ERP cost visibility**: `hideAmounts` controlled via `/api/my-erp-pages` `hiddenErpCostFields`
- **Export**: Detailed XLSX export via ExcelJS with one sheet per voucher type

### Sales Report Page
- **Period Presets**: same preset bar as Daybook
- **Keyboard navigation**: `↑↓` / `Enter` to navigate and open daily summaries
- Grouping by daily / monthly / yearly; profit filter (all / positive / negative)

### Point of Sale (POS)
- POS roles get a restricted layout: POS, Daybook, Location Inventory, Stock Transfer tabs
- Location-authenticated POS sessions
- Barcode scanning support; server-side PNG barcode generation

### Partners & Service
- Suppliers (global, transaction-filtered by company)
- Revendeurs / Customers with customer profiles
- Service history, warranty tracking, communication log, purchase history

### Assembly
- Motorcycle assembly records from component stock items
- Assembly history page

### Payroll
- Employee management with auto-generated employee codes
- Payroll voucher creation

### Settings (Admin-only)
- **Tabs**: Companies, Users, Fiscal Period, Preferences, System, Role Permissions, Admin Panel
- **Admin Panel tab** (Admin role only):
  - Active sessions table with force-logout per session (30-second auto-refresh)
  - DB storage stats (table row counts and sizes)
  - System tools quick links
  - Cache management

### Admin Backend Endpoints
- `GET /api/admin/active-sessions` — list active PostgreSQL sessions
- `DELETE /api/admin/sessions/:sid` — force-logout a session
- `GET /api/admin/db-stats` — table row counts and sizes
- All protected with `requireAuth` + `requireRole("Admin")`

## Component Library

| Component | Path | Purpose |
|---|---|---|
| `ErrorBoundary` | `client/src/components/ErrorBoundary.tsx` | Class-based error boundary with retry |
| `OfflineBanner` | `client/src/components/OfflineBanner.tsx` | Fixed offline/reconnected banner |
| `PeriodPresets` | `client/src/components/PeriodPresets.tsx` | Quick-period button bar (Today–All Time) |
| `CommandPalette` | `client/src/components/CommandPalette.tsx` | Ctrl+K page search palette |
| `AccountAutocomplete` | `client/src/components/AccountAutocomplete.tsx` | Searchable account picker (ledger/bank/supplier/factorySupplier/employee/fixedAsset) |
| `AppSidebar` | `client/src/components/AppSidebar.tsx` | Main nav sidebar |
| `CompanySelector` | `client/src/components/CompanySelector.tsx` | Header company switcher |
| `ThemeProvider` / `ThemeToggle` | `client/src/components/` | Dark/light mode |
| `DatePickerInput` | `client/src/components/ui/date-picker-input.tsx` | Styled date input |

## Contexts

| Context | Purpose |
|---|---|
| `CompanyContext` | Selected company state, shared across app |
| `LocationContext` | Selected location for POS/inventory |
| `DateFormatContext` | User date format preference (DD/MM/YYYY etc.) |
| `CurrencyContext` | Multi-currency: USD/CFA toggle, exchange rate, `formatAmount()` |

## File Structure

```
/
├── client/
│   └── src/
│       ├── App.tsx              # Root: lazy pages, ErrorBoundary, OfflineBanner, CommandPalette
│       ├── pages/               # All route-level pages (lazy-loaded)
│       ├── components/          # Reusable UI components
│       ├── contexts/            # React contexts
│       ├── hooks/               # Custom hooks
│       └── lib/                 # Utilities (queryClient, utils)
├── server/
│   ├── index.ts                 # Express entry point
│   ├── routes.ts                # All API routes
│   ├── auth.ts                  # Auth middleware (requireAuth, requireRole)
│   └── db.ts                    # Drizzle DB connection
└── shared/
    └── schema.ts                # Drizzle schema + Zod types (shared frontend/backend)
```

## External Dependencies

- **UI**: Radix UI, Tailwind CSS, shadcn/ui, `cmdk`, `recharts`, `date-fns`, `react-day-picker`, `embla-carousel-react`
- **Database**: `pg` (node-postgres), `drizzle-orm`, `drizzle-kit`, `connect-pg-simple`
- **Forms**: `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-zod`
- **Spreadsheet export**: `xlsx`
- **Build**: Vite, `esbuild`, PostCSS + Autoprefixer
- **AI (legacy)**: Google Gemini API integration (admin-controlled access)
