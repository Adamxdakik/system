import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "../../db";
import {
  bankAccounts,
  customers,
  employees,
  fixedAssets,
  ledgerAccounts,
  locations,
  suppliers,
  voucherEntries,
  vouchers,
} from "@shared/schema";
import { decimalToScaledInteger, scaledIntegerToDecimal } from "./money";
import type {
  AccountingStore,
  AccountingTransaction,
  PostedEntry,
  PostedVoucher,
  PostingEntryInput,
  PostingResult,
  VoucherPostingInput,
} from "./types";

type DrizzleTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

function mapVoucher(row: typeof vouchers.$inferSelect): PostedVoucher {
  return {
    id: row.id,
    companyId: row.companyId,
    voucherNumber: row.voucherNumber,
    voucherType: row.voucherType,
    transactionDate: row.voucherDate,
    currency: row.currency,
    exchangeRate: row.exchangeRate,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    idempotencyKey: row.idempotencyKey,
    idempotencyFingerprint: row.idempotencyFingerprint,
    optional: row.optional,
    reversalOfVoucherId: row.reversalOfVoucherId,
    reversedAt: row.reversedAt,
  };
}

function mapEntry(row: typeof voucherEntries.$inferSelect): PostedEntry {
  return {
    id: row.id,
    voucherId: row.voucherId,
    ledgerAccountId: row.ledgerAccountId,
    bankAccountId: row.bankAccountId,
    fixedAssetId: row.fixedAssetId,
    customerId: row.customerId,
    supplierId: row.supplierId,
    employeeId: row.employeeId,
    debitAmount: row.debitAmount,
    creditAmount: row.creditAmount,
    description: row.narration,
    currency: row.currency,
    foreignAmount: row.foreignAmount,
    exchangeRate: row.exchangeRate,
    baseAmount: row.baseAmount,
  };
}

async function loadResult(
  tx: DrizzleTransaction,
  voucher: typeof vouchers.$inferSelect,
): Promise<PostingResult> {
  const entries = await tx
    .select()
    .from(voucherEntries)
    .where(eq(voucherEntries.voucherId, voucher.id));
  return {
    voucher: mapVoucher(voucher),
    entries: entries.map(mapEntry),
    duplicate: false,
  };
}

async function missingCompanyIds(
  tx: DrizzleTransaction,
  ids: number[],
  companyId: number,
  table:
    | typeof ledgerAccounts
    | typeof bankAccounts
    | typeof fixedAssets
    | typeof customers
    | typeof employees
    | typeof locations,
): Promise<number[]> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return [];
  const rows = await tx
    .select({ id: table.id })
    .from(table)
    .where(and(inArray(table.id, uniqueIds), eq(table.companyId, companyId)));
  const found = new Set(rows.map((row) => row.id));
  return uniqueIds.filter((id) => !found.has(id));
}

class DrizzleAccountingTransaction implements AccountingTransaction {
  constructor(private readonly tx: DrizzleTransaction) {}

  async findByIdempotencyKey(
    companyId: number,
    idempotencyKey: string,
  ): Promise<PostingResult | null> {
    const [voucher] = await this.tx
      .select()
      .from(vouchers)
      .where(and(eq(vouchers.companyId, companyId), eq(vouchers.idempotencyKey, idempotencyKey)))
      .limit(1);
    return voucher ? loadResult(this.tx, voucher) : null;
  }

  async findBySource(
    companyId: number,
    sourceType: string,
    sourceId: string,
  ): Promise<PostingResult | null> {
    const [voucher] = await this.tx
      .select()
      .from(vouchers)
      .where(
        and(
          eq(vouchers.companyId, companyId),
          eq(vouchers.sourceType, sourceType),
          eq(vouchers.sourceId, sourceId),
        ),
      )
      .limit(1);
    return voucher ? loadResult(this.tx, voucher) : null;
  }

  async validateReferences(
    companyId: number,
    entries: PostingEntryInput[],
    locationId?: number | null,
  ): Promise<string[]> {
    const issues: string[] = [];
    const referenceGroups = [
      {
        label: "ledgerAccount",
        ids: entries.flatMap((entry) =>
          entry.ledgerAccountId == null ? [] : [entry.ledgerAccountId],
        ),
        table: ledgerAccounts,
      },
      {
        label: "bankAccount",
        ids: entries.flatMap((entry) => (entry.bankAccountId == null ? [] : [entry.bankAccountId])),
        table: bankAccounts,
      },
      {
        label: "fixedAsset",
        ids: entries.flatMap((entry) => (entry.fixedAssetId == null ? [] : [entry.fixedAssetId])),
        table: fixedAssets,
      },
      {
        label: "customer",
        ids: entries.flatMap((entry) => (entry.customerId == null ? [] : [entry.customerId])),
        table: customers,
      },
      {
        label: "employee",
        ids: entries.flatMap((entry) => (entry.employeeId == null ? [] : [entry.employeeId])),
        table: employees,
      },
    ] as const;

    for (const group of referenceGroups) {
      const missing = await missingCompanyIds(this.tx, group.ids, companyId, group.table);
      issues.push(...missing.map((id) => `${group.label}:${id}`));
    }

    const supplierIds = [
      ...new Set(entries.flatMap((entry) => (entry.supplierId == null ? [] : [entry.supplierId]))),
    ];
    if (supplierIds.length > 0) {
      const rows = await this.tx
        .select({ id: suppliers.id, companyId: suppliers.companyId })
        .from(suppliers)
        .where(inArray(suppliers.id, supplierIds));
      const valid = new Set(rows.filter((row) => row.companyId === companyId).map((row) => row.id));
      issues.push(...supplierIds.filter((id) => !valid.has(id)).map((id) => `supplier:${id}`));
    }
    if (locationId != null) {
      const missing = await missingCompanyIds(this.tx, [locationId], companyId, locations);
      issues.push(...missing.map((id) => `location:${id}`));
    }

    return issues;
  }

  async createVoucher(
    input: VoucherPostingInput,
    totalAmount: string,
    fingerprint: string,
    reversalOfVoucherId?: number | null,
  ): Promise<PostedVoucher> {
    const [created] = await this.tx
      .insert(vouchers)
      .values({
        companyId: input.companyId,
        locationId: input.locationId,
        voucherNumber: input.voucherNumber,
        voucherType: input.voucherType,
        voucherDate: input.transactionDate,
        description: input.description,
        totalAmount,
        currency: input.currency ?? "USD",
        exchangeRate: input.exchangeRate ?? "1",
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        idempotencyKey: input.idempotencyKey,
        idempotencyFingerprint: fingerprint,
        reversalOfVoucherId,
        createdBy: input.createdBy,
        optional: input.optional ?? false,
      })
      .returning();
    return mapVoucher(created);
  }

  async createEntries(voucherId: number, entries: PostingEntryInput[]): Promise<PostedEntry[]> {
    const created = await this.tx
      .insert(voucherEntries)
      .values(
        entries.map((entry) => ({
          voucherId,
          ledgerAccountId: entry.ledgerAccountId,
          bankAccountId: entry.bankAccountId,
          fixedAssetId: entry.fixedAssetId,
          customerId: entry.customerId,
          supplierId: entry.supplierId,
          employeeId: entry.employeeId,
          debitAmount: entry.debitAmount,
          creditAmount: entry.creditAmount,
          currency: entry.currency ?? "USD",
          foreignAmount: entry.foreignAmount,
          exchangeRate: entry.exchangeRate,
          baseAmount: entry.baseAmount ?? "0",
          narration: entry.description,
        })),
      )
      .returning();
    return created.map(mapEntry);
  }

  async applySupportingBalances(entries: PostingEntryInput[], direction: 1 | -1): Promise<void> {
    const employeeDeltas = new Map<number, bigint>();
    for (const entry of entries) {
      if (entry.employeeId == null) continue;
      const debit = decimalToScaledInteger(entry.debitAmount, 2);
      const credit = decimalToScaledInteger(entry.creditAmount, 2);
      const delta = BigInt(direction) * (credit - debit);
      employeeDeltas.set(entry.employeeId, (employeeDeltas.get(entry.employeeId) ?? 0n) + delta);
    }
    for (const [employeeId, delta] of employeeDeltas) {
      await this.tx
        .update(employees)
        .set({
          currentBalance: sql`${employees.currentBalance} + ${scaledIntegerToDecimal(delta, 2)}`,
        })
        .where(eq(employees.id, employeeId));
    }
  }

  async loadVoucherForReversal(
    companyId: number,
    voucherId: number,
  ): Promise<PostingResult | null> {
    const [voucher] = await this.tx
      .select()
      .from(vouchers)
      .where(and(eq(vouchers.id, voucherId), eq(vouchers.companyId, companyId)))
      .for("update")
      .limit(1);
    return voucher ? loadResult(this.tx, voucher) : null;
  }

  async markReversed(voucherId: number, reversedAt: Date): Promise<void> {
    await this.tx.update(vouchers).set({ reversedAt }).where(eq(vouchers.id, voucherId));
  }
}

export class DrizzleAccountingStore implements AccountingStore {
  transaction<T>(work: (tx: AccountingTransaction) => Promise<T>): Promise<T> {
    return db.transaction((tx) => work(new DrizzleAccountingTransaction(tx)));
  }
}

export const accountingStore = new DrizzleAccountingStore();
