import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "../../db";
import { inventory, salesItems, stockItems, vouchers } from "@shared/schema";
import { accountingTransactionFor, type DrizzleTransaction } from "./drizzleAccountingStore";
import { decimalToScaledInteger, normalizeMoney, scaledIntegerToDecimal } from "./money";
import type { PostedEntry, PostingEntryInput, PostingResult } from "./types";
import { AccountingIntegrityError, postVoucherInTransaction } from "./voucherPostingService";

export interface PosSaleCorrectionItem {
  id?: number | null;
  stockItemId: number;
  quantity: string;
  sellingPrice?: string | null;
  rate?: string | null;
}

export interface PosSaleCorrectionInput {
  companyId: number;
  voucherId: number;
  description?: string | null;
  transactionDate?: string | null;
  items: PosSaleCorrectionItem[];
  idempotencyKey: string;
  createdBy?: string | null;
  canSellNegativeStock: boolean;
}

export interface PosSaleCancellationInput {
  companyId: number;
  voucherId: number;
  idempotencyKey: string;
  createdBy?: string | null;
  reason?: string | null;
}

export interface PosSaleCorrectionResult {
  originalVoucherId: number;
  reversal: PostingResult;
  replacement: PostingResult;
  saleItems: Array<typeof salesItems.$inferSelect>;
  duplicate: boolean;
}

export interface PosSaleCancellationResult {
  originalVoucherId: number;
  reversal: PostingResult;
  duplicate: boolean;
}

type InventoryRow = typeof inventory.$inferSelect;
type SaleItemRow = typeof salesItems.$inferSelect;

function suffix(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12).toUpperCase();
}

function roundDivide(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error("Denominator must be positive");
  return (numerator + denominator / 2n) / denominator;
}

function lineAmount(quantityMilli: bigint, rateCents: bigint): bigint {
  return roundDivide(quantityMilli * rateCents, 1000n);
}

function foreignAmount(baseCents: bigint, exchangeRate: string | null): string | null {
  if (!exchangeRate) return null;
  const rate = decimalToScaledInteger(exchangeRate, 8);
  if (rate <= 0n) return null;
  const cents = roundDivide(baseCents * 100000000n, rate);
  return scaledIntegerToDecimal(cents, 2);
}

function allocateSide(
  entries: PostedEntry[],
  side: "debit" | "credit",
  totalCents: bigint,
): Map<number, bigint> {
  const selected = entries.filter((entry) =>
    side === "debit"
      ? decimalToScaledInteger(entry.debitAmount, 2) > 0n
      : decimalToScaledInteger(entry.creditAmount, 2) > 0n,
  );
  if (selected.length === 0) {
    throw new AccountingIntegrityError(
      `Original POS voucher has no ${side} entries`,
      "INVALID_POS_ACCOUNTING_STRUCTURE",
      409,
    );
  }
  const originalTotal = selected.reduce(
    (sum, entry) =>
      sum + decimalToScaledInteger(side === "debit" ? entry.debitAmount : entry.creditAmount, 2),
    0n,
  );
  if (originalTotal <= 0n) {
    throw new AccountingIntegrityError(
      "Original POS voucher has invalid entry totals",
      "INVALID_POS_ACCOUNTING_STRUCTURE",
      409,
    );
  }

  const allocations = new Map<number, bigint>();
  let allocated = 0n;
  selected.forEach((entry, index) => {
    const amount =
      index === selected.length - 1
        ? totalCents - allocated
        : (totalCents *
            decimalToScaledInteger(side === "debit" ? entry.debitAmount : entry.creditAmount, 2)) /
          originalTotal;
    allocations.set(entry.id, amount);
    allocated += amount;
  });
  return allocations;
}

function replacementEntries(
  originalEntries: PostedEntry[],
  totalCents: bigint,
): PostingEntryInput[] {
  const debitAllocations = allocateSide(originalEntries, "debit", totalCents);
  const creditAllocations = allocateSide(originalEntries, "credit", totalCents);

  return originalEntries.map((entry) => {
    const debit = debitAllocations.get(entry.id) ?? 0n;
    const credit = creditAllocations.get(entry.id) ?? 0n;
    const base = debit > 0n ? debit : credit;
    const currency = entry.currency || "USD";
    return {
      ledgerAccountId: entry.ledgerAccountId,
      bankAccountId: entry.bankAccountId,
      fixedAssetId: entry.fixedAssetId,
      customerId: entry.customerId,
      supplierId: entry.supplierId,
      employeeId: entry.employeeId,
      debitAmount: scaledIntegerToDecimal(debit, 2),
      creditAmount: scaledIntegerToDecimal(credit, 2),
      description: entry.description,
      currency,
      exchangeRate: entry.exchangeRate,
      foreignAmount: currency === "USD" ? null : foreignAmount(base, entry.exchangeRate),
      baseAmount: scaledIntegerToDecimal(base, 2),
    };
  });
}

function reversalEntries(originalEntries: PostedEntry[]): PostingEntryInput[] {
  return originalEntries.map((entry) => ({
    ledgerAccountId: entry.ledgerAccountId,
    bankAccountId: entry.bankAccountId,
    fixedAssetId: entry.fixedAssetId,
    customerId: entry.customerId,
    supplierId: entry.supplierId,
    employeeId: entry.employeeId,
    debitAmount: entry.creditAmount,
    creditAmount: entry.debitAmount,
    description: entry.description,
    currency: entry.currency,
    foreignAmount: entry.foreignAmount,
    exchangeRate: entry.exchangeRate,
    baseAmount: entry.baseAmount,
  }));
}

function aggregateQuantities(
  items: Array<{ stockItemId: number; quantity: string }>,
): Map<number, bigint> {
  const totals = new Map<number, bigint>();
  for (const item of items) {
    const quantity = decimalToScaledInteger(item.quantity, 3);
    totals.set(item.stockItemId, (totals.get(item.stockItemId) ?? 0n) + quantity);
  }
  return totals;
}

async function lockInventoryRows(
  tx: DrizzleTransaction,
  companyId: number,
  locationId: number,
  stockItemIds: number[],
): Promise<Map<number, InventoryRow>> {
  if (stockItemIds.length === 0) return new Map();
  const rows = await tx
    .select()
    .from(inventory)
    .where(
      and(
        eq(inventory.companyId, companyId),
        eq(inventory.locationId, locationId),
        inArray(inventory.stockItemId, stockItemIds),
      ),
    )
    .for("update");
  return new Map(rows.map((row) => [row.stockItemId, row]));
}

export function calculateInventoryMovementState(
  currentQuantity: string,
  currentValue: string,
  quantityDelta: string,
  valueDelta: string,
): { quantity: string; totalValue: string; averageRate: string } {
  const currentQuantityMinor = decimalToScaledInteger(currentQuantity, 3);
  const currentValueMinor = decimalToScaledInteger(currentValue, 2);
  const quantityDeltaMinor = decimalToScaledInteger(quantityDelta, 3);
  const valueDeltaMinor = decimalToScaledInteger(valueDelta, 2);
  const nextQuantity = currentQuantityMinor + quantityDeltaMinor;
  let nextValue = currentValueMinor + valueDeltaMinor;

  if (nextQuantity === 0n) nextValue = 0n;

  let averageRate = 0n;
  if (nextQuantity !== 0n) {
    const numerator = nextValue * 1000n;
    const numeratorAbs = numerator < 0n ? -numerator : numerator;
    const denominatorAbs = nextQuantity < 0n ? -nextQuantity : nextQuantity;
    const rounded = (numeratorAbs + denominatorAbs / 2n) / denominatorAbs;
    averageRate = numerator < 0n !== nextQuantity < 0n ? -rounded : rounded;
    if (averageRate < 0n) {
      throw new AccountingIntegrityError(
        "Inventory quantity and value have inconsistent signs",
        "INVALID_INVENTORY_VALUE_STATE",
        409,
      );
    }
  }

  return {
    quantity: scaledIntegerToDecimal(nextQuantity, 3),
    totalValue: scaledIntegerToDecimal(nextValue, 2),
    averageRate: scaledIntegerToDecimal(averageRate, 2),
  };
}

function aggregateRestorationTotals(
  items: SaleItemRow[],
): Map<number, { quantity: bigint; value: bigint }> {
  const totals = new Map<number, { quantity: bigint; value: bigint }>();
  for (const item of items) {
    const current = totals.get(item.stockItemId) ?? { quantity: 0n, value: 0n };
    totals.set(item.stockItemId, {
      quantity: current.quantity + decimalToScaledInteger(item.quantity, 3),
      value: current.value + decimalToScaledInteger(item.totalCost, 2),
    });
  }
  return totals;
}

async function restoreOriginalInventory(
  tx: DrizzleTransaction,
  companyId: number,
  locationId: number,
  originalItems: SaleItemRow[],
  lockedRows: Map<number, InventoryRow>,
): Promise<void> {
  const restoreTotals = aggregateRestorationTotals(originalItems);
  for (const [stockItemId, restore] of restoreTotals) {
    const row = lockedRows.get(stockItemId);
    const state = calculateInventoryMovementState(
      row?.quantity ?? "0",
      row?.totalValue ?? "0",
      scaledIntegerToDecimal(restore.quantity, 3),
      scaledIntegerToDecimal(restore.value, 2),
    );

    if (!row) {
      const [created] = await tx
        .insert(inventory)
        .values({
          companyId,
          locationId,
          stockItemId,
          ...state,
          lastUpdated: new Date(),
        })
        .returning();
      lockedRows.set(stockItemId, created);
      continue;
    }

    await tx
      .update(inventory)
      .set({ ...state, lastUpdated: new Date() })
      .where(eq(inventory.id, row.id));
    lockedRows.set(stockItemId, { ...row, ...state });
  }
}

async function createReplacementItems(
  tx: DrizzleTransaction,
  voucherId: number,
  companyId: number,
  locationId: number,
  requestedItems: PosSaleCorrectionItem[],
  originalItems: SaleItemRow[],
  lockedRows: Map<number, InventoryRow>,
  canSellNegativeStock: boolean,
): Promise<{ rows: SaleItemRow[]; totalCents: bigint }> {
  const stockIds = [...new Set(requestedItems.map((item) => item.stockItemId))];
  const products = await tx.select().from(stockItems).where(inArray(stockItems.id, stockIds));
  const productMap = new Map(products.map((product) => [product.id, product]));
  const originalById = new Map(originalItems.map((item) => [item.id, item]));
  const requestedTotals = aggregateQuantities(requestedItems);

  for (const [stockItemId, requestedQuantity] of requestedTotals) {
    const row = lockedRows.get(stockItemId);
    if (!row) {
      throw new AccountingIntegrityError(
        `Inventory not found for item ${stockItemId}`,
        "POS_INVENTORY_NOT_FOUND",
        404,
      );
    }
    const available = decimalToScaledInteger(row.quantity, 3);
    if (available < requestedQuantity && !canSellNegativeStock) {
      throw new AccountingIntegrityError(
        `Insufficient stock for item ${stockItemId}. Available: ${scaledIntegerToDecimal(available, 3)}, requested: ${scaledIntegerToDecimal(requestedQuantity, 3)}`,
        "INSUFFICIENT_STOCK",
        409,
      );
    }
  }

  const rows: SaleItemRow[] = [];
  let totalCents = 0n;
  const requestedCosts = new Map<number, bigint>();
  for (const requested of requestedItems) {
    const quantity = decimalToScaledInteger(requested.quantity, 3);
    if (quantity <= 0n) {
      throw new AccountingIntegrityError(
        "POS sale quantity must be positive",
        "INVALID_POS_QUANTITY",
      );
    }
    const inventoryRow = lockedRows.get(requested.stockItemId)!;
    const oldLine = requested.id ? originalById.get(requested.id) : undefined;
    const costCents =
      oldLine && oldLine.stockItemId === requested.stockItemId
        ? decimalToScaledInteger(oldLine.costPrice, 2)
        : decimalToScaledInteger(inventoryRow.averageRate, 2);
    const product = productMap.get(requested.stockItemId);
    const configuredPrice = product?.sellingPrice
      ? decimalToScaledInteger(product.sellingPrice, 2)
      : 0n;
    const submittedPrice = decimalToScaledInteger(
      requested.sellingPrice ?? requested.rate ?? "0",
      2,
    );
    const sellingPrice = configuredPrice > 0n ? configuredPrice : submittedPrice;
    if (sellingPrice < 0n) {
      throw new AccountingIntegrityError(
        "POS selling price cannot be negative",
        "INVALID_POS_PRICE",
      );
    }

    const totalSales = lineAmount(quantity, sellingPrice);
    const totalCost = lineAmount(quantity, costCents);
    requestedCosts.set(
      requested.stockItemId,
      (requestedCosts.get(requested.stockItemId) ?? 0n) + totalCost,
    );
    const [created] = await tx
      .insert(salesItems)
      .values({
        voucherId,
        stockItemId: requested.stockItemId,
        quantity: scaledIntegerToDecimal(quantity, 3),
        sellingPrice: scaledIntegerToDecimal(sellingPrice, 2),
        costPrice: scaledIntegerToDecimal(costCents, 2),
        totalSales: scaledIntegerToDecimal(totalSales, 2),
        totalCost: scaledIntegerToDecimal(totalCost, 2),
        profit: scaledIntegerToDecimal(totalSales - totalCost, 2),
      })
      .returning();
    rows.push(created);
    totalCents += totalSales;
  }

  for (const [stockItemId, requestedQuantity] of requestedTotals) {
    const row = lockedRows.get(stockItemId)!;
    const requestedCost = requestedCosts.get(stockItemId) ?? 0n;
    const state = calculateInventoryMovementState(
      row.quantity,
      row.totalValue,
      scaledIntegerToDecimal(-requestedQuantity, 3),
      scaledIntegerToDecimal(-requestedCost, 2),
    );
    await tx
      .update(inventory)
      .set({ ...state, lastUpdated: new Date() })
      .where(eq(inventory.id, row.id));
    lockedRows.set(stockItemId, { ...row, ...state });
  }

  return { rows, totalCents };
}

export class PosSaleCorrectionService {
  correct(input: PosSaleCorrectionInput): Promise<PosSaleCorrectionResult> {
    if (input.items.length === 0) {
      throw new AccountingIntegrityError("At least one POS item is required", "POS_ITEMS_REQUIRED");
    }
    const reversalKey = `${input.idempotencyKey}:reversal`;
    const replacementKey = `${input.idempotencyKey}:replacement`;

    return db.transaction(async (tx) => {
      const accountingTx = accountingTransactionFor(tx);
      const existingReplacement = await accountingTx.findByIdempotencyKey(
        input.companyId,
        replacementKey,
      );
      if (existingReplacement) {
        const rows = await tx
          .select()
          .from(salesItems)
          .where(eq(salesItems.voucherId, existingReplacement.voucher.id));
        const reversal = await accountingTx.findBySource(
          input.companyId,
          "VOUCHER_REVERSAL",
          String(input.voucherId),
        );
        if (!reversal) {
          throw new AccountingIntegrityError(
            "POS replacement exists without its reversal",
            "INCOMPLETE_POS_CORRECTION",
            409,
          );
        }
        return {
          originalVoucherId: input.voucherId,
          reversal: { ...reversal, duplicate: true },
          replacement: { ...existingReplacement, duplicate: true },
          saleItems: rows,
          duplicate: true,
        };
      }

      const original = await accountingTx.loadVoucherForReversal(input.companyId, input.voucherId);
      if (!original) {
        throw new AccountingIntegrityError("POS voucher not found", "VOUCHER_NOT_FOUND", 404);
      }
      if (original.voucher.voucherType !== "Sales") {
        throw new AccountingIntegrityError(
          "Only finalized sales vouchers can use POS correction",
          "VOUCHER_TYPE_MISMATCH",
          409,
        );
      }
      if (original.voucher.optional) {
        throw new AccountingIntegrityError(
          "Draft POS sales must use the draft workflow",
          "DRAFT_REQUIRES_EDIT",
          409,
        );
      }
      if (original.voucher.reversedAt) {
        throw new AccountingIntegrityError(
          "POS voucher has already been reversed",
          "VOUCHER_ALREADY_REVERSED",
          409,
        );
      }
      if (!original.voucher.currency || !original.voucher.exchangeRate) {
        throw new AccountingIntegrityError(
          "POS correction requires confirmed historical FX metadata",
          "UNRESOLVED_LEGACY_FX",
          409,
        );
      }

      const [voucherRow] = await tx
        .select({ locationId: vouchers.locationId, description: vouchers.description })
        .from(vouchers)
        .where(and(eq(vouchers.id, input.voucherId), eq(vouchers.companyId, input.companyId)))
        .for("update")
        .limit(1);
      const saleLocationId = Number(voucherRow?.locationId);
      if (!Number.isInteger(saleLocationId) || saleLocationId <= 0) {
        throw new AccountingIntegrityError(
          "POS voucher does not have a valid location",
          "POS_LOCATION_REQUIRED",
          409,
        );
      }

      const originalItems = await tx
        .select()
        .from(salesItems)
        .where(eq(salesItems.voucherId, input.voucherId));
      if (originalItems.length === 0) {
        throw new AccountingIntegrityError(
          "POS voucher has no sale items",
          "POS_ITEMS_NOT_FOUND",
          409,
        );
      }

      const stockIds = [
        ...new Set([
          ...originalItems.map((item) => item.stockItemId),
          ...input.items.map((item) => item.stockItemId),
        ]),
      ];
      const lockedRows = await lockInventoryRows(tx, input.companyId, saleLocationId, stockIds);
      await restoreOriginalInventory(
        tx,
        input.companyId,
        saleLocationId,
        originalItems,
        lockedRows,
      );

      const reversal = await postVoucherInTransaction(
        accountingTx,
        {
          companyId: input.companyId,
          locationId: saleLocationId,
          voucherType: "Sales",
          voucherNumber: `${original.voucher.voucherNumber}-REV-${suffix(reversalKey)}`,
          transactionDate: original.voucher.transactionDate,
          description: `POS correction reversal of ${original.voucher.voucherNumber}`,
          currency: original.voucher.currency,
          exchangeRate: original.voucher.exchangeRate,
          sourceType: "VOUCHER_REVERSAL",
          sourceId: String(original.voucher.id),
          idempotencyKey: reversalKey,
          createdBy: input.createdBy,
          optional: false,
          entries: reversalEntries(original.entries),
        },
        original.voucher.id,
      );
      if (!reversal.duplicate) {
        await accountingTx.markReversed(original.voucher.id, new Date());
      }

      const products = await tx
        .select({ id: stockItems.id, sellingPrice: stockItems.sellingPrice })
        .from(stockItems)
        .where(inArray(stockItems.id, [...new Set(input.items.map((item) => item.stockItemId))]));
      const configuredPrices = new Map(
        products.map((product) => [product.id, product.sellingPrice]),
      );
      const placeholderTotal = input.items.reduce((sum, item) => {
        const quantity = decimalToScaledInteger(item.quantity, 3);
        const configured = configuredPrices.get(item.stockItemId);
        const configuredPrice = configured ? decimalToScaledInteger(configured, 2) : 0n;
        const submittedPrice = decimalToScaledInteger(item.sellingPrice ?? item.rate ?? "0", 2);
        return sum + lineAmount(quantity, configuredPrice > 0n ? configuredPrice : submittedPrice);
      }, 0n);
      const replacement = await postVoucherInTransaction(accountingTx, {
        companyId: input.companyId,
        locationId: saleLocationId,
        voucherType: "Sales",
        voucherNumber: `${original.voucher.voucherNumber}-CORR-${suffix(replacementKey)}`,
        transactionDate: input.transactionDate ?? original.voucher.transactionDate,
        description: input.description ?? voucherRow?.description ?? null,
        currency: original.voucher.currency,
        exchangeRate: original.voucher.exchangeRate,
        sourceType: "POS_SALE_REPLACEMENT",
        sourceId: `${input.voucherId}:${input.idempotencyKey}`,
        idempotencyKey: replacementKey,
        createdBy: input.createdBy,
        optional: false,
        entries: replacementEntries(original.entries, placeholderTotal),
      });

      const replacementItems = await createReplacementItems(
        tx,
        replacement.voucher.id,
        input.companyId,
        saleLocationId,
        input.items,
        originalItems,
        lockedRows,
        input.canSellNegativeStock,
      );
      if (replacementItems.totalCents !== placeholderTotal) {
        throw new AccountingIntegrityError(
          `Configured POS prices changed the replacement total from ${normalizeMoney(scaledIntegerToDecimal(placeholderTotal, 2))} to ${normalizeMoney(scaledIntegerToDecimal(replacementItems.totalCents, 2))}`,
          "POS_PRICE_CHANGED_DURING_CORRECTION",
          409,
        );
      }

      return {
        originalVoucherId: original.voucher.id,
        reversal,
        replacement,
        saleItems: replacementItems.rows,
        duplicate: false,
      };
    });
  }

  cancel(input: PosSaleCancellationInput): Promise<PosSaleCancellationResult> {
    const reversalKey = `${input.idempotencyKey}:reversal`;
    return db.transaction(async (tx) => {
      const accountingTx = accountingTransactionFor(tx);
      const existing = await accountingTx.findByIdempotencyKey(input.companyId, reversalKey);
      if (existing) {
        return {
          originalVoucherId: input.voucherId,
          reversal: { ...existing, duplicate: true },
          duplicate: true,
        };
      }

      const original = await accountingTx.loadVoucherForReversal(input.companyId, input.voucherId);
      if (!original) {
        throw new AccountingIntegrityError("POS voucher not found", "VOUCHER_NOT_FOUND", 404);
      }
      if (original.voucher.voucherType !== "Sales") {
        throw new AccountingIntegrityError(
          "Only sales vouchers can use POS cancellation",
          "VOUCHER_TYPE_MISMATCH",
          409,
        );
      }
      if (original.voucher.optional) {
        throw new AccountingIntegrityError(
          "Draft POS sales must use the draft workflow",
          "DRAFT_REQUIRES_EDIT",
          409,
        );
      }
      if (original.voucher.reversedAt) {
        throw new AccountingIntegrityError(
          "POS voucher has already been reversed",
          "VOUCHER_ALREADY_REVERSED",
          409,
        );
      }
      if (!original.voucher.currency || !original.voucher.exchangeRate) {
        throw new AccountingIntegrityError(
          "POS cancellation requires confirmed historical FX metadata",
          "UNRESOLVED_LEGACY_FX",
          409,
        );
      }

      const [voucherRow] = await tx
        .select({ locationId: vouchers.locationId })
        .from(vouchers)
        .where(and(eq(vouchers.id, input.voucherId), eq(vouchers.companyId, input.companyId)))
        .for("update")
        .limit(1);
      const saleLocationId = Number(voucherRow?.locationId);
      if (!Number.isInteger(saleLocationId) || saleLocationId <= 0) {
        throw new AccountingIntegrityError(
          "POS voucher does not have a valid location",
          "POS_LOCATION_REQUIRED",
          409,
        );
      }
      const originalItems = await tx
        .select()
        .from(salesItems)
        .where(eq(salesItems.voucherId, input.voucherId));
      if (originalItems.length === 0) {
        throw new AccountingIntegrityError(
          "POS voucher has no sale items",
          "POS_ITEMS_NOT_FOUND",
          409,
        );
      }
      const stockIds = [...new Set(originalItems.map((item) => item.stockItemId))];
      const lockedRows = await lockInventoryRows(tx, input.companyId, saleLocationId, stockIds);
      await restoreOriginalInventory(
        tx,
        input.companyId,
        saleLocationId,
        originalItems,
        lockedRows,
      );

      const reversal = await postVoucherInTransaction(
        accountingTx,
        {
          companyId: input.companyId,
          locationId: saleLocationId,
          voucherType: "Sales",
          voucherNumber: `${original.voucher.voucherNumber}-REV-${suffix(reversalKey)}`,
          transactionDate: original.voucher.transactionDate,
          description: input.reason ?? `POS cancellation of ${original.voucher.voucherNumber}`,
          currency: original.voucher.currency,
          exchangeRate: original.voucher.exchangeRate,
          sourceType: "VOUCHER_REVERSAL",
          sourceId: String(original.voucher.id),
          idempotencyKey: reversalKey,
          createdBy: input.createdBy,
          optional: false,
          entries: reversalEntries(original.entries),
        },
        original.voucher.id,
      );
      if (!reversal.duplicate) {
        await accountingTx.markReversed(original.voucher.id, new Date());
      }
      return { originalVoucherId: original.voucher.id, reversal, duplicate: reversal.duplicate };
    });
  }
}
