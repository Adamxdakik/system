# MotoTrack ERP/POS — HuangHe Motors (HHM)

## Overview

MotoTrack is a comprehensive ERP and POS system for HuangHe Motors (HHM), a motorcycle import and distribution company. Its main purpose is to manage multi-location inventory, streamline container-based purchasing, handle full double-entry financial accounting, process payroll, and manage supplier and customer relationships. Key capabilities include tracking motorcycle assembly, maintaining after-sales service records, supporting multiple companies with isolated data, role-based access control, and a dedicated administration panel. The business vision is to provide a robust system for efficient operations and growth in the DRC market.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

- **Framework**: React 18 with TypeScript and Vite.
- **Routing**: Client-side routing using `wouter`.
- **State Management**: TanStack Query for server state and React hooks/context for local UI state.
- **Forms**: `react-hook-form` integrated with Zod and `drizzle-zod` for validation.
- **UI/UX**: Uses shadcn/ui (New York style) built on Radix UI primitives, styled with Tailwind CSS, with Inter and JetBrains Mono fonts. Supports light and dark modes.
- **Performance**: Pages are lazy-loaded with `<Suspense>` for fallbacks.
- **Error Handling**: Class-based `<ErrorBoundary>` for robust error management.
- **User Experience**: Includes an `<OfflineBanner>` for network status and a `<CommandPalette>` (Ctrl+K / Cmd+K) for quick navigation.

### Backend

- **Server**: Express.js with TypeScript.
- **API**: RESTful endpoints, secured with `requireAuth` middleware and validated using Zod.
- **Sessions**: PostgreSQL-backed session management via `connect-pg-simple`.
- **Build**: Vite for client build, `esbuild` for server, with custom Vite/HMR dev integration.
- **Error Handling**: Centralized error handling via `asyncHandler` and ZodError handling for 400 responses.

### Database

- **Engine**: PostgreSQL, accessed via `DATABASE_URL`.
- **ORM**: Drizzle ORM with `drizzle-kit` for schema migrations.
- **Schema**: A single `shared/schema.ts` file for type consistency.
- **Core Tables**: `users`, `companies`, `locations`, `stock_items`, `vouchers`, `purchase_orders`, `ledger_accounts`, `employees`, `suppliers`, `customers`, `session`, `employee_moto_rates`, `employee_moto_pct_rates`, `moto_rate_audit`, `rate_templates`, `rate_template_items`, `notifications`.

### Key Features

- **Inventory**: Multi-location stock tracking, container-based purchase orders, stock transfers, production/consumption vouchers.
- **Financial Accounting**: Full double-entry voucher system (Sales, Purchase, Payment, Receipt, Journal, Contra, Stock Transfer, Production, Consumption), auto-generated vouchers, ledger account hierarchy, financial reports (Income Statement, Daybook, Opening/Closing Stock). Simplified UX for account transfers and adjustments.
- **Point of Sale (POS)**: Restricted interface, location-authenticated sessions, barcode scanning.
- **Partners & Service**: Supplier and customer management, service history, warranty tracking, communication logs.
- **Assembly**: Records for motorcycle assembly from components.
- **Payroll**: Employee management, payroll voucher creation, detailed moto bonus rate management with effective dating, templates, and audit logs.
- **Settings (Admin-only)**: Admin panel for companies, users, fiscal periods, system preferences, role permissions, active sessions, and database statistics.
- **Security**: Hardened authentication, centralized error handling, Zod input validation, dependency cleanup, and security audits addressing potential vulnerabilities like IDORs and cross-tenant data leaks. Implementation of soft-deletes and corresponding safe-guards to prevent data leakage.
- **Auditing**: Comprehensive audit logging for critical data changes, particularly in employee moto rates.
- **Notifications**: In-app notification system for key events.
- **Health Checks**: `/api/health` and `/api/health/deep` endpoints for monitoring system status.

## External Dependencies

- **UI Libraries**: Radix UI, Tailwind CSS, shadcn/ui, `cmdk`.
- **Charting**: `recharts`.
- **Date Handling**: `date-fns`, `react-day-picker`.
- **Carousel**: `embla-carousel-react`.
- **Database Drivers/Tools**: `pg` (node-postgres), `drizzle-orm`, `drizzle-kit`, `connect-pg-simple`.
- **Form Management/Validation**: `react-hook-form`, `@hookform/resolvers`, `zod`, `drizzle-zod`.
- **Spreadsheet Export**: `exceljs`.
- **Build Tools**: Vite, `esbuild`, PostCSS, Autoprefixer.
- **AI Integration**: Google Gemini API (admin-controlled access).
## Pass H — Full-app smoke test (May 03, 2026)

- E2E smoke-tested all 56 pages logged in as admin: every page renders without React error overlays, blank states, or HTTP 500s.
- Fix: `client/src/pages/Settings.tsx` users table — replaced bare `<>` Fragment in `users.map` (Fragment couldn't accept the Replit Vite plugin's `data-replit-metadata` prop) with `flatMap` returning sibling `<TableRow key="...-main">` and `<TableRow key="...-detail">`. Removes "Each child in a list should have a unique key" and "Invalid prop supplied to React.Fragment" warnings on /settings.
- Authored `USAGE_GUIDE.md` documenting every page and common workflows.
