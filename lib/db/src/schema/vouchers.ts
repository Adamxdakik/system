import { pgTable, serial, text, integer, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { accountsTable } from "./accounts";

export const vouchersTable = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companiesTable.id),
  voucherNumber: text("voucher_number").notNull(),
  voucherType: text("voucher_type").notNull().default("Journal"),
  voucherDate: date("voucher_date", { mode: "string" }).notNull(),
  description: text("description"),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const voucherEntriesTable = pgTable("voucher_entries", {
  id: serial("id").primaryKey(),
  voucherId: integer("voucher_id").notNull().references(() => vouchersTable.id),
  accountId: integer("account_id").notNull().references(() => accountsTable.id),
  debitAmount: numeric("debit_amount", { precision: 14, scale: 2 }),
  creditAmount: numeric("credit_amount", { precision: 14, scale: 2 }),
  narration: text("narration"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVoucherSchema = createInsertSchema(vouchersTable).omit({ id: true, createdAt: true });
export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type Voucher = typeof vouchersTable.$inferSelect;
export type VoucherEntry = typeof voucherEntriesTable.$inferSelect;
