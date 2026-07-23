# MotoTrack ERP/POS — HuangHe Motors (HHM)

## Overview

MotoTrack is a comprehensive ERP and POS system for HuangHe Motors (HHM), a motorcycle import and distribution company. Its main purpose is to manage multi-location inventory, streamline container-based purchasing, handle full double-entry financial accounting, process payroll, and manage supplier and customer relationships.

## System Architecture

### Legacy App (client/ + server/)

The original codebase lives in `client/` (React 18 + Vite frontend) and `server/` (Express.js backend). It uses a single root `package.json` and a single `shared/schema.ts` for types. Run with `tsx server/index.ts` on port 5000.

### New ERP/POS (artifacts/)

A full rebuild of the system using a pnpm workspace monorepo:

- **artifacts/mototrack** — React 18 + Vite frontend (port from `$PORT`)
- **artifacts/api-server** — Express 5 API server (port 8080)
- **lib/db** — Drizzle ORM + PostgreSQL schema
- **lib/api-client-react** — Auto-generated React Query hooks (Orval)
- **lib/api-zod** — Auto-generated Zod validators (Orval)

## Run & Operate (new artifacts)

- `pnpm --filter @workspace/api-server run dev` — API server
- `pnpm --filter @workspace/mototrack run dev` — frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack (new artifacts)

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (ESM bundle)

## User Preferences

Preferred communication style: Simple, everyday language.

## Key Features (new artifacts)

- Multi-tenant ERP/POS (companies, locations, users with roles)
- Inventory: stock groups, stock items, containers/import shipments
- Financial: double-entry voucher system, daybook, ledger accounts
- POS terminal with day-by-day sales history
- Payroll: employees per company
- Session-based auth (SHA-256 passwords, express-session)
- Company selector after login

## Gotchas

- Always run `pnpm --filter @workspace/api-server run build` before restarting the API workflow after route changes
- Voucher types stored as uppercase (SALES, RECEIPT, PAYMENT, JOURNAL)
- Session requires `credentials: 'include'` on all fetch calls — handled by `custom-fetch.ts`
