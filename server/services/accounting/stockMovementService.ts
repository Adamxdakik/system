import { createHash } from "node:crypto";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "../../db";
import {
  inventory,
  locations,
  stockAdjustmentItems,
  stockAdjustmentVouchers,
  stockItems,
  stockTransferItems,
  stockTransferVouchers,
  vouchers,
} from "@shared/schema";
import type { DrizzleTransaction } from "./drizzleAccountingStore";
import { decimalToScaledInteger, scaledIntegerToDecimal } from "./money";
import { stockMovementCostEvidence } from "./stockMovementEvidenceSchema";
import { AccountingIntegrityError } from "./voucherPostingService";

export type StockMovementKind = "TRANSFER" | "ADJUSTMENT";
export type AdjustmentKind = "Production" | "Consumption" | "Mixed";

export interface AtomicVoucherInput {
  voucherDate: string;
  voucherNumber?: string | null;
  description?: string | null;
  optional?: boolean;
  currency?: string | null;
  exchangeRate?: string | null;
}

export interface AtomicTransferLine {
  sourceLocationId: number;
  stockItemId: number;
  quantity: string;
  rate?: string | null;
}

export interface AtomicTransferInput {
  companyId: number;
  voucher: AtomicVoucherInput;
  destinationLocationId: number;
  notes?: string | null;
  items: AtomicTransferLine[];
  idempotencyKey: string;
  createdBy?: string | null;
}

export interface AtomicAdjustmentLine {
  stockItemId: number;
  quantity: string;
  rate?: string | null;
}

export interface AtomicAdjustmentInput {
  companyId: number;
  voucher: AtomicVoucherInput;
  locationId: number;
  adjustmentType: AdjustmentKind;
  notes?: string | null;
  items: AtomicAdjustmentLine[];
  idempotencyKey: string;
  createdBy?: string | null;
}

interface NormalizedTransferLine {
  sourceLocationId: number;
  stockItemId: number;
  quantityMinor: bigint;
  quantity: string;
  requestedRateMinor: bigint;
  requestedRate: string;
  requestedTotalMinor: bigint;
}

interface NormalizedAdjustmentLine {
  stockItemId: number;
  quantityMinor: bigint;
  quantity: string;
  direction: "PRODUCTION" | "CONSUMPTION";
  requestedRateMinor: bigint;
  requestedRate: string;
  requestedTotalMinor: bigint;
}

interface InventoryState {
  id: number;
  quantityMinor: bigint;
  valueMinor: bigint;
}

interface MovementResult {
  voucher: typeof vouchers.$inferSelect;
  movement: typeof stockTransferVouchers.$inferSelect | typeof stockAdjustmentVouchers.$inferSelect;
  items: Array<typeof stockTransferItems.$inferSelect | typeof stockAdjustmentItems.$inferSelect>;
  duplicate: boolean;
}

interface ReversalResult {
  voucher: typeof vouchers.$inferSelect;
  originalVoucher: typeof vouchers.$inferSelect;
  duplicate: boolean;
}

const QUANTITY_SCALE = 3;
const MONEY_SCALE = 2;
const RATE_SCALE = 6;
const RATE_TO_MONEY_DIVISOR = 10_000_000n;

function integrity(message: string, code: string, status = 409): never {
  throw new AccountingIntegrityError(message, code, status);
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    integrity(`${label} is invalid`, "INVALID_STOCK_MOVEMENT_REFERENCE", 400);
  }
  return value;
}

function positiveQuantity(value: string): bigint {
  const quantity = decimalToScaledInteger(value, QUANTITY_SCALE);
  if (quantity <= 0n) {
    integrity("Stock movement quantity must be positive", "INVALID_STOCK_QUANTITY", 400);
  }
  return quantity;
}

function signedQuantity(value: string): bigint {
  const quantity = decimalToScaledInteger(value, QUANTITY_SCALE);
  if (quantity === 0n) {
    integrity("Stock adjustment quantity cannot be zero", "INVALID_STOCK_QUANTITY", 400);
  }
  return quantity;
}

function nonNegativeRate(value: string | null | undefined): bigint {
  const rate = decimalToScaledInteger(value == null || value === "" ? "0" : value, RATE_SCALE);
  if (rate < 0n) {
    integrity("Stock movement rate cannot be negative", "INVALID_STOCK_RATE", 400);
  }
  return rate;
}

function roundDivide(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) integrity("Cannot divide by zero", "INVALID_STOCK_COST");
  const negative = numerator < 0n !== denominator < 0n;
  const left = numerator < 0n ? -numerator : numerator;
  const right = denominator < 0n ? -denominator : denominator;
  const quotient = left / right;
  const remainder = left % right;
  const rounded = quotient + (remainder * 2n >= right ? 1n : 0n);
  return negative ? -rounded : rounded;
}

function requestedValue(quantityMinor: bigint, rateMinor: bigint): bigint {
  return roundDivide(quantityMinor * rateMinor, RATE_TO_MONEY_DIVISOR);
}

function legacyRate(rateMinor: bigint): string {
  return scaledIntegerToDecimal(roundDivide(rateMinor, 10_000n), MONEY_SCALE);
}

function proportionalValue(
  currentValue: bigint,
  movedQuantity: bigint,
  currentQuantity: bigint,
): bigint {
  if (movedQuantity === currentQuantity) return currentValue;
  return roundDivide(currentValue * movedQuantity, currentQuantity);
}

function unitCost(actualValueMinor: bigint, quantityMinor: bigint): string {
  if (quantityMinor <= 0n) {
    integrity("Evidence quantity must be positive", "INVALID_STOCK_COST");
  }
  const microPerUnit = roundDivide(actualValueMinor * RATE_TO_MONEY_DIVISOR, quantityMinor);
  return scaledIntegerToDecimal(microPerUnit, RATE_SCALE);
}

function averageRate(valueMinor: bigint, quantityMinor: bigint): string {
  if (quantityMinor === 0n) {
    if (valueMinor !== 0n) {
      integrity("Zero inventory quantity has a non-zero value", "INVENTORY_VALUE_MISMATCH");
    }
    return "0.00";
  }
  if (quantityMinor < 0n !== valueMinor < 0n) {
    integrity("Inventory quantity and value signs do not match", "INVENTORY_VALUE_MISMATCH");
  }
  const centsPerUnit = roundDivide(valueMinor * 1000n, quantityMinor);
  if (centsPerUnit < 0n) {
    integrity("Inventory average cost cannot be negative", "INVENTORY_VALUE_MISMATCH");
  }
  return scaledIntegerToDecimal(centsPerUnit, MONEY_SCALE);
}

function normalizeCurrency(value: string | null | undefined): string {
  const currency = (value ?? "USD").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    integrity("Currency must be a three-letter code", "INVALID_CURRENCY", 400);
  }
  return currency;
}

function normalizeExchangeRate(value: string | null | undefined): string {
  const rate = decimalToScaledInteger(value == null || value === "" ? "1" : value, 8);
  if (rate <= 0n) {
    integrity("Exchange rate must be positive", "INVALID_EXCHANGE_RATE", 400);
  }
  return scaledIntegerToDecimal(rate, 8);
}

function normalizeDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    integrity("Voucher date must use YYYY-MM-DD", "INVALID_VOUCHER_DATE", 400);
  }
  return value;
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function suffix(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16).toUpperCase();
}

function validateIdentity(value: string): string {
  const identity = value.trim();
  if (!identity || identity.length > 200) {
    integrity("A valid idempotency key is required", "INVALID_IDEMPOTENCY_KEY", 400);
  }
  return identity;
}

function normalizeTransferLines(
  items: AtomicTransferLine[],
  destinationLocationId: number,
): NormalizedTransferLine[] {
  if (!Array.isArray(items) || items.length === 0) {
    integrity("At least one transfer item is required", "STOCK_ITEMS_REQUIRED", 400);
  }
  const seen = new Set<string>();
  return items.map((item) => {
    const sourceLocationId = positiveInteger(Number(item.sourceLocationId), "Source location");
    const stockItemId = positiveInteger(Number(item.stockItemId), "Stock item");
    if (sourceLocationId === destinationLocationId) {
      integrity("Source and destination locations must differ", "SAME_STOCK_LOCATION", 400);
    }
    const key = `${sourceLocationId}:${stockItemId}`;
    if (seen.has(key)) {
      integrity("Duplicate source/item lines are not allowed", "DUPLICATE_STOCK_LINE", 400);
    }
    seen.add(key);
    const quantityMinor = positiveQuantity(String(item.quantity));
    const requestedRateMinor = nonNegativeRate(item.rate);
    return {
      sourceLocationId,
      stockItemId,
      quantityMinor,
      quantity: scaledIntegerToDecimal(quantityMinor, QUANTITY_SCALE),
      requestedRateMinor,
      requestedRate: scaledIntegerToDecimal(requestedRateMinor, RATE_SCALE),
      requestedTotalMinor: requestedValue(quantityMinor, requestedRateMinor),
    };
  });
}

function normalizeAdjustmentLines(
  items: AtomicAdjustmentLine[],
  adjustmentType: AdjustmentKind,
): NormalizedAdjustmentLine[] {
  if (!Array.isArray(items) || items.length === 0) {
    integrity("At least one adjustment item is required", "STOCK_ITEMS_REQUIRED", 400);
  }
  const seen = new Set<string>();
  const normalized = items.map((item) => {
    const stockItemId = positiveInteger(Number(item.stockItemId), "Stock item");
    const signed = signedQuantity(String(item.quantity));
    const direction = signed > 0n ? "PRODUCTION" : "CONSUMPTION";
    const quantityMinor = signed > 0n ? signed : -signed;
    const key = `${stockItemId}:${direction}`;
    if (seen.has(key)) {
      integrity("Duplicate item/direction lines are not allowed", "DUPLICATE_STOCK_LINE", 400);
    }
    seen.add(key);
    const requestedRateMinor = nonNegativeRate(item.rate);
    return {
      stockItemId,
      quantityMinor,
      quantity: scaledIntegerToDecimal(signed, QUANTITY_SCALE),
      direction,
      requestedRateMinor,
      requestedRate: scaledIntegerToDecimal(requestedRateMinor, RATE_SCALE),
      requestedTotalMinor: requestedValue(quantityMinor, requestedRateMinor),
    } as NormalizedAdjustmentLine;
  });
  const hasProduction = normalized.some((line) => line.direction === "PRODUCTION");
  const hasConsumption = normalized.some((line) => line.direction === "CONSUMPTION");
  if (adjustmentType === "Production" && hasConsumption) {
    integrity(
      "Production adjustments cannot contain consumption lines",
      "INVALID_ADJUSTMENT_TYPE",
      400,
    );
  }
  if (adjustmentType === "Consumption" && hasProduction) {
    integrity(
      "Consumption adjustments cannot contain production lines",
      "INVALID_ADJUSTMENT_TYPE",
      400,
    );
  }
  if (adjustmentType === "Mixed" && (!hasProduction || !hasConsumption)) {
    integrity(
      "Mixed adjustments require production and consumption lines",
      "INVALID_ADJUSTMENT_TYPE",
      400,
    );
  }
  return normalized.sort((left, right) => {
    if (left.direction !== right.direction) {
      return left.direction === "CONSUMPTION" ? -1 : 1;
    }
    return left.stockItemId - right.stockItemId;
  });
}

async function validateCompanyReferences(
  tx: DrizzleTransaction,
  companyId: number,
  locationIds: number[],
  stockItemIds: number[],
): Promise<void> {
  const uniqueLocations = [...new Set(locationIds)];
  const uniqueItems = [...new Set(stockItemIds)];
  const ownedLocations = await tx
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.companyId, companyId), inArray(locations.id, uniqueLocations)));
  if (ownedLocations.length !== uniqueLocations.length) {
    integrity("A stock location does not belong to the selected company", "WRONG_COMPANY", 403);
  }
  const ownedItems = await tx
    .select({ id: stockItems.id })
    .from(stockItems)
    .where(and(eq(stockItems.companyId, companyId), inArray(stockItems.id, uniqueItems)));
  if (ownedItems.length !== uniqueItems.length) {
    integrity("A stock item does not belong to the selected company", "WRONG_COMPANY", 403);
  }
}

async function lockBuckets(
  tx: DrizzleTransaction,
  companyId: number,
  buckets: Array<{ locationId: number; stockItemId: number }>,
): Promise<void> {
  const keys = [
    ...new Set(buckets.map((bucket) => `${bucket.locationId}:${bucket.stockItemId}`)),
  ].sort();
  for (const key of keys) {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${`inventory:${companyId}:${key}`}, 0))`,
    );
  }
}

async function loadInventory(
  tx: DrizzleTransaction,
  companyId: number,
  locationId: number,
  stockItemId: number,
): Promise<InventoryState | null> {
  const rows = await tx
    .select({ id: inventory.id, quantity: inventory.quantity, totalValue: inventory.totalValue })
    .from(inventory)
    .where(
      and(
        eq(inventory.companyId, companyId),
        eq(inventory.locationId, locationId),
        eq(inventory.stockItemId, stockItemId),
      ),
    )
    .for("update");
  if (rows.length > 1) {
    integrity(
      `Duplicate inventory rows exist for location ${locationId}, stock item ${stockItemId}`,
      "DUPLICATE_INVENTORY_ROWS",
    );
  }
  if (!rows[0]) return null;
  return {
    id: rows[0].id,
    quantityMinor: decimalToScaledInteger(rows[0].quantity, QUANTITY_SCALE),
    valueMinor: decimalToScaledInteger(rows[0].totalValue, MONEY_SCALE),
  };
}

async function writeInventory(
  tx: DrizzleTransaction,
  companyId: number,
  locationId: number,
  stockItemId: number,
  existing: InventoryState | null,
  quantityMinor: bigint,
  valueMinor: bigint,
): Promise<void> {
  const values = {
    quantity: scaledIntegerToDecimal(quantityMinor, QUANTITY_SCALE),
    averageRate: averageRate(valueMinor, quantityMinor),
    totalValue: scaledIntegerToDecimal(valueMinor, MONEY_SCALE),
    lastUpdated: new Date(),
  };
  if (existing) {
    await tx.update(inventory).set(values).where(eq(inventory.id, existing.id));
  } else {
    if (quantityMinor === 0n && valueMinor === 0n) return;
    await tx.insert(inventory).values({ companyId, locationId, stockItemId, ...values });
  }
}

async function locationName(
  tx: DrizzleTransaction,
  companyId: number,
  locationId: number,
): Promise<string | null> {
  const [row] = await tx
    .select({ name: locations.name })
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.companyId, companyId)))
    .limit(1);
  return row?.name ?? null;
}

async function existingVoucherByIdentity(
  tx: DrizzleTransaction,
  companyId: number,
  idempotencyKey: string,
) {
  const [row] = await tx
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.companyId, companyId), eq(vouchers.idempotencyKey, idempotencyKey)))
    .limit(1);
  return row ?? null;
}

async function createMovementVoucher(
  tx: DrizzleTransaction,
  input: {
    companyId: number;
    locationId: number;
    locationName: string | null;
    voucher: AtomicVoucherInput;
    voucherType: string;
    sourceType: string;
    idempotencyKey: string;
    fingerprint: string;
    requestedTotalMinor: bigint;
    createdBy?: string | null;
  },
): Promise<{ voucher: typeof vouchers.$inferSelect; duplicate: boolean }> {
  const existing = await existingVoucherByIdentity(tx, input.companyId, input.idempotencyKey);
  if (existing) {
    if (existing.idempotencyFingerprint !== input.fingerprint) {
      integrity(
        "Idempotency key was already used with different stock movement details",
        "IDEMPOTENCY_PAYLOAD_MISMATCH",
      );
    }
    return { voucher: existing, duplicate: true };
  }
  const voucherNumber = (
    input.voucher.voucherNumber?.trim() || `${input.sourceType}-${suffix(input.idempotencyKey)}`
  ).slice(0, 100);
  const [created] = await tx
    .insert(vouchers)
    .values({
      companyId: input.companyId,
      locationId: input.locationId,
      locationName: input.locationName,
      voucherNumber,
      voucherType: input.voucherType,
      voucherDate: normalizeDate(input.voucher.voucherDate),
      description: input.voucher.description ?? null,
      totalAmount: scaledIntegerToDecimal(input.requestedTotalMinor, MONEY_SCALE),
      currency: normalizeCurrency(input.voucher.currency),
      exchangeRate: normalizeExchangeRate(input.voucher.exchangeRate),
      sourceType: input.sourceType,
      sourceId: suffix(input.idempotencyKey),
      idempotencyKey: input.idempotencyKey,
      idempotencyFingerprint: input.fingerprint,
      createdBy: input.createdBy ?? null,
      optional: input.voucher.optional ?? false,
    })
    .onConflictDoNothing()
    .returning();
  if (created) return { voucher: created, duplicate: false };
  const concurrent = await existingVoucherByIdentity(tx, input.companyId, input.idempotencyKey);
  if (!concurrent) {
    integrity(
      "Voucher number or source identity is already in use",
      "STOCK_MOVEMENT_IDENTITY_CONFLICT",
    );
  }
  if (concurrent.idempotencyFingerprint !== input.fingerprint) {
    integrity(
      "Idempotency key was already used with different stock movement details",
      "IDEMPOTENCY_PAYLOAD_MISMATCH",
    );
  }
  return { voucher: concurrent, duplicate: true };
}

async function loadTransferResult(
  tx: DrizzleTransaction,
  voucher: typeof vouchers.$inferSelect,
  duplicate: boolean,
): Promise<MovementResult> {
  const [movement] = await tx
    .select()
    .from(stockTransferVouchers)
    .where(eq(stockTransferVouchers.voucherId, voucher.id))
    .limit(1);
  if (!movement) {
    integrity("Stock transfer record was not found", "STOCK_MOVEMENT_NOT_FOUND", 404);
  }
  const items = await tx
    .select()
    .from(stockTransferItems)
    .where(eq(stockTransferItems.transferId, movement.id));
  return { voucher, movement, items, duplicate };
}

async function loadAdjustmentResult(
  tx: DrizzleTransaction,
  voucher: typeof vouchers.$inferSelect,
  duplicate: boolean,
): Promise<MovementResult> {
  const [movement] = await tx
    .select()
    .from(stockAdjustmentVouchers)
    .where(eq(stockAdjustmentVouchers.voucherId, voucher.id))
    .limit(1);
  if (!movement) {
    integrity("Stock adjustment record was not found", "STOCK_MOVEMENT_NOT_FOUND", 404);
  }
  const items = await tx
    .select()
    .from(stockAdjustmentItems)
    .where(eq(stockAdjustmentItems.adjustmentId, movement.id));
  return { voucher, movement, items, duplicate };
}

async function applyTransfer(
  tx: DrizzleTransaction,
  companyId: number,
  voucherId: number,
  destinationLocationId: number,
  movementId: number,
  lines: NormalizedTransferLine[],
  existingItems?: Array<typeof stockTransferItems.$inferSelect>,
): Promise<{ items: Array<typeof stockTransferItems.$inferSelect>; totalMinor: bigint }> {
  await lockBuckets(
    tx,
    companyId,
    lines.flatMap((line) => [
      { locationId: line.sourceLocationId, stockItemId: line.stockItemId },
      { locationId: destinationLocationId, stockItemId: line.stockItemId },
    ]),
  );
  const existingByKey = new Map(
    (existingItems ?? []).map((item) => [
      `${item.sourceLocationId ?? 0}:${item.stockItemId}`,
      item,
    ]),
  );
  const resultItems: Array<typeof stockTransferItems.$inferSelect> = [];
  let totalMinor = 0n;
  for (const line of lines) {
    const source = await loadInventory(tx, companyId, line.sourceLocationId, line.stockItemId);
    if (!source || source.quantityMinor < line.quantityMinor || source.quantityMinor <= 0n) {
      integrity(
        `Insufficient inventory at source location ${line.sourceLocationId} for stock item ${line.stockItemId}`,
        "INSUFFICIENT_STOCK",
        409,
      );
    }
    if (source.valueMinor < 0n) {
      integrity("Source inventory has a negative value", "INVENTORY_VALUE_MISMATCH");
    }
    const actualValueMinor = proportionalValue(
      source.valueMinor,
      line.quantityMinor,
      source.quantityMinor,
    );
    await writeInventory(
      tx,
      companyId,
      line.sourceLocationId,
      line.stockItemId,
      source,
      source.quantityMinor - line.quantityMinor,
      source.valueMinor - actualValueMinor,
    );

    const destination = await loadInventory(tx, companyId, destinationLocationId, line.stockItemId);
    await writeInventory(
      tx,
      companyId,
      destinationLocationId,
      line.stockItemId,
      destination,
      (destination?.quantityMinor ?? 0n) + line.quantityMinor,
      (destination?.valueMinor ?? 0n) + actualValueMinor,
    );

    const actualUnit = unitCost(actualValueMinor, line.quantityMinor);
    const legacyUnit = legacyRate(decimalToScaledInteger(actualUnit, RATE_SCALE));
    const existingItem = existingByKey.get(`${line.sourceLocationId}:${line.stockItemId}`);
    const item = existingItem
      ? (
          await tx
            .update(stockTransferItems)
            .set({
              rate: legacyUnit,
              totalAmount: scaledIntegerToDecimal(actualValueMinor, MONEY_SCALE),
            })
            .where(eq(stockTransferItems.id, existingItem.id))
            .returning()
        )[0]
      : (
          await tx
            .insert(stockTransferItems)
            .values({
              transferId: movementId,
              stockItemId: line.stockItemId,
              sourceLocationId: line.sourceLocationId,
              quantity: line.quantity,
              rate: legacyUnit,
              totalAmount: scaledIntegerToDecimal(actualValueMinor, MONEY_SCALE),
            })
            .returning()
        )[0];
    await tx.insert(stockMovementCostEvidence).values({
      companyId,
      originalVoucherId: voucherId,
      movementKind: "TRANSFER",
      movementItemId: item.id,
      stockItemId: line.stockItemId,
      sourceLocationId: line.sourceLocationId,
      destinationLocationId,
      quantity: line.quantity,
      actualUnitCost: actualUnit,
      actualTotalCost: scaledIntegerToDecimal(actualValueMinor, MONEY_SCALE),
      evidenceStatus: "EXACT",
    });
    resultItems.push(item);
    totalMinor += actualValueMinor;
  }
  return { items: resultItems, totalMinor };
}

async function applyAdjustment(
  tx: DrizzleTransaction,
  companyId: number,
  voucherId: number,
  locationId: number,
  movementId: number,
  lines: NormalizedAdjustmentLine[],
  existingItems?: Array<typeof stockAdjustmentItems.$inferSelect>,
): Promise<{ items: Array<typeof stockAdjustmentItems.$inferSelect>; totalMinor: bigint }> {
  await lockBuckets(
    tx,
    companyId,
    lines.map((line) => ({ locationId, stockItemId: line.stockItemId })),
  );
  const existingByKey = new Map(
    (existingItems ?? []).map((item) => [
      `${item.stockItemId}:${decimalToScaledInteger(item.quantity, QUANTITY_SCALE) > 0n ? "PRODUCTION" : "CONSUMPTION"}`,
      item,
    ]),
  );
  const resultItems: Array<typeof stockAdjustmentItems.$inferSelect> = [];
  let totalMinor = 0n;
  for (const line of lines) {
    const current = await loadInventory(tx, companyId, locationId, line.stockItemId);
    let actualValueMinor: bigint;
    let evidenceStatus: "EXACT" | "DECLARED_PRODUCTION";
    if (line.direction === "PRODUCTION") {
      actualValueMinor = line.requestedTotalMinor;
      evidenceStatus = "DECLARED_PRODUCTION";
      await writeInventory(
        tx,
        companyId,
        locationId,
        line.stockItemId,
        current,
        (current?.quantityMinor ?? 0n) + line.quantityMinor,
        (current?.valueMinor ?? 0n) + actualValueMinor,
      );
    } else {
      if (!current || current.quantityMinor < line.quantityMinor || current.quantityMinor <= 0n) {
        integrity(
          `Insufficient inventory at location ${locationId} for stock item ${line.stockItemId}`,
          "INSUFFICIENT_STOCK",
          409,
        );
      }
      if (current.valueMinor < 0n) {
        integrity("Inventory has a negative value", "INVENTORY_VALUE_MISMATCH");
      }
      actualValueMinor = proportionalValue(
        current.valueMinor,
        line.quantityMinor,
        current.quantityMinor,
      );
      evidenceStatus = "EXACT";
      await writeInventory(
        tx,
        companyId,
        locationId,
        line.stockItemId,
        current,
        current.quantityMinor - line.quantityMinor,
        current.valueMinor - actualValueMinor,
      );
    }
    const actualUnit = unitCost(actualValueMinor, line.quantityMinor);
    const rate = legacyRate(decimalToScaledInteger(actualUnit, RATE_SCALE));
    const existingItem = existingByKey.get(`${line.stockItemId}:${line.direction}`);
    const item = existingItem
      ? (
          await tx
            .update(stockAdjustmentItems)
            .set({
              rate,
              totalAmount: scaledIntegerToDecimal(actualValueMinor, MONEY_SCALE),
            })
            .where(eq(stockAdjustmentItems.id, existingItem.id))
            .returning()
        )[0]
      : (
          await tx
            .insert(stockAdjustmentItems)
            .values({
              adjustmentId: movementId,
              stockItemId: line.stockItemId,
              quantity: line.quantity,
              rate,
              totalAmount: scaledIntegerToDecimal(actualValueMinor, MONEY_SCALE),
            })
            .returning()
        )[0];
    await tx.insert(stockMovementCostEvidence).values({
      companyId,
      originalVoucherId: voucherId,
      movementKind: "ADJUSTMENT",
      movementItemId: item.id,
      stockItemId: line.stockItemId,
      sourceLocationId: line.direction === "CONSUMPTION" ? locationId : null,
      destinationLocationId: line.direction === "PRODUCTION" ? locationId : null,
      quantity: scaledIntegerToDecimal(line.quantityMinor, QUANTITY_SCALE),
      actualUnitCost: actualUnit,
      actualTotalCost: scaledIntegerToDecimal(actualValueMinor, MONEY_SCALE),
      evidenceStatus,
    });
    resultItems.push(item);
    totalMinor += actualValueMinor;
  }
  return { items: resultItems, totalMinor };
}

export class StockMovementService {
  createTransfer(input: AtomicTransferInput): Promise<MovementResult> {
    const companyId = positiveInteger(input.companyId, "Company");
    const destinationLocationId = positiveInteger(
      input.destinationLocationId,
      "Destination location",
    );
    const identity = validateIdentity(input.idempotencyKey);
    const lines = normalizeTransferLines(input.items, destinationLocationId);
    const requestedTotalMinor = lines.reduce((sum, line) => sum + line.requestedTotalMinor, 0n);
    const fingerprint = hash({
      kind: "TRANSFER",
      companyId,
      destinationLocationId,
      voucher: input.voucher,
      notes: input.notes ?? null,
      items: lines.map((line) => ({
        sourceLocationId: line.sourceLocationId,
        stockItemId: line.stockItemId,
        quantity: line.quantity,
        rate: line.requestedRate,
      })),
    });
    return db.transaction(async (tx) => {
      await validateCompanyReferences(
        tx,
        companyId,
        [destinationLocationId, ...lines.map((line) => line.sourceLocationId)],
        lines.map((line) => line.stockItemId),
      );
      const firstSource = lines[0].sourceLocationId;
      const voucherRecord = await createMovementVoucher(tx, {
        companyId,
        locationId: firstSource,
        locationName: await locationName(tx, companyId, firstSource),
        voucher: input.voucher,
        voucherType: "StockTransfer",
        sourceType: "ATOMIC_STOCK_TRANSFER",
        idempotencyKey: identity,
        fingerprint,
        requestedTotalMinor,
        createdBy: input.createdBy,
      });
      if (voucherRecord.duplicate) {
        return loadTransferResult(tx, voucherRecord.voucher, true);
      }
      const [movement] = await tx
        .insert(stockTransferVouchers)
        .values({
          voucherId: voucherRecord.voucher.id,
          sourceLocationId: firstSource,
          destinationLocationId,
          notes: input.notes ?? null,
        })
        .returning();
      if (voucherRecord.voucher.optional) {
        const inserted: Array<typeof stockTransferItems.$inferSelect> = [];
        for (const line of lines) {
          const [item] = await tx
            .insert(stockTransferItems)
            .values({
              transferId: movement.id,
              stockItemId: line.stockItemId,
              sourceLocationId: line.sourceLocationId,
              quantity: line.quantity,
              rate: legacyRate(line.requestedRateMinor),
              totalAmount: scaledIntegerToDecimal(line.requestedTotalMinor, MONEY_SCALE),
            })
            .returning();
          inserted.push(item);
        }
        return {
          voucher: voucherRecord.voucher,
          movement,
          items: inserted,
          duplicate: false,
        };
      }
      const applied = await applyTransfer(
        tx,
        companyId,
        voucherRecord.voucher.id,
        destinationLocationId,
        movement.id,
        lines,
      );
      const [updatedVoucher] = await tx
        .update(vouchers)
        .set({ totalAmount: scaledIntegerToDecimal(applied.totalMinor, MONEY_SCALE) })
        .where(eq(vouchers.id, voucherRecord.voucher.id))
        .returning();
      return { voucher: updatedVoucher, movement, items: applied.items, duplicate: false };
    });
  }

  createAdjustment(input: AtomicAdjustmentInput): Promise<MovementResult> {
    const companyId = positiveInteger(input.companyId, "Company");
    const locationId = positiveInteger(input.locationId, "Location");
    const identity = validateIdentity(input.idempotencyKey);
    const lines = normalizeAdjustmentLines(input.items, input.adjustmentType);
    const requestedTotalMinor = lines.reduce((sum, line) => sum + line.requestedTotalMinor, 0n);
    const fingerprint = hash({
      kind: "ADJUSTMENT",
      companyId,
      locationId,
      adjustmentType: input.adjustmentType,
      voucher: input.voucher,
      notes: input.notes ?? null,
      items: lines.map((line) => ({
        stockItemId: line.stockItemId,
        quantity: line.quantity,
        rate: line.requestedRate,
      })),
    });
    return db.transaction(async (tx) => {
      await validateCompanyReferences(
        tx,
        companyId,
        [locationId],
        lines.map((line) => line.stockItemId),
      );
      const voucherRecord = await createMovementVoucher(tx, {
        companyId,
        locationId,
        locationName: await locationName(tx, companyId, locationId),
        voucher: input.voucher,
        voucherType: input.adjustmentType,
        sourceType: "ATOMIC_STOCK_ADJUSTMENT",
        idempotencyKey: identity,
        fingerprint,
        requestedTotalMinor,
        createdBy: input.createdBy,
      });
      if (voucherRecord.duplicate) {
        return loadAdjustmentResult(tx, voucherRecord.voucher, true);
      }
      const [movement] = await tx
        .insert(stockAdjustmentVouchers)
        .values({
          voucherId: voucherRecord.voucher.id,
          locationId,
          adjustmentType: input.adjustmentType,
          notes: input.notes ?? null,
        })
        .returning();
      if (voucherRecord.voucher.optional) {
        const inserted: Array<typeof stockAdjustmentItems.$inferSelect> = [];
        for (const line of lines) {
          const [item] = await tx
            .insert(stockAdjustmentItems)
            .values({
              adjustmentId: movement.id,
              stockItemId: line.stockItemId,
              quantity: line.quantity,
              rate: legacyRate(line.requestedRateMinor),
              totalAmount: scaledIntegerToDecimal(line.requestedTotalMinor, MONEY_SCALE),
            })
            .returning();
          inserted.push(item);
        }
        return {
          voucher: voucherRecord.voucher,
          movement,
          items: inserted,
          duplicate: false,
        };
      }
      const applied = await applyAdjustment(
        tx,
        companyId,
        voucherRecord.voucher.id,
        locationId,
        movement.id,
        lines,
      );
      const [updatedVoucher] = await tx
        .update(vouchers)
        .set({ totalAmount: scaledIntegerToDecimal(applied.totalMinor, MONEY_SCALE) })
        .where(eq(vouchers.id, voucherRecord.voucher.id))
        .returning();
      return { voucher: updatedVoucher, movement, items: applied.items, duplicate: false };
    });
  }

  async movementKind(companyId: number, voucherId: number): Promise<StockMovementKind | null> {
    const [voucher] = await db
      .select({ id: vouchers.id })
      .from(vouchers)
      .where(and(eq(vouchers.id, voucherId), eq(vouchers.companyId, companyId)))
      .limit(1);
    if (!voucher) return null;
    const [transfer] = await db
      .select({ id: stockTransferVouchers.id })
      .from(stockTransferVouchers)
      .where(eq(stockTransferVouchers.voucherId, voucherId))
      .limit(1);
    if (transfer) return "TRANSFER";
    const [adjustment] = await db
      .select({ id: stockAdjustmentVouchers.id })
      .from(stockAdjustmentVouchers)
      .where(eq(stockAdjustmentVouchers.voucherId, voucherId))
      .limit(1);
    return adjustment ? "ADJUSTMENT" : null;
  }

  activate(companyId: number, voucherId: number): Promise<MovementResult> {
    return db.transaction(async (tx) => {
      const [voucher] = await tx
        .select()
        .from(vouchers)
        .where(and(eq(vouchers.id, voucherId), eq(vouchers.companyId, companyId)))
        .for("update")
        .limit(1);
      if (!voucher) integrity("Voucher not found", "VOUCHER_NOT_FOUND", 404);
      if (!voucher.optional) {
        integrity(
          "Finalized stock movements cannot be changed back to optional; create a linked reversal",
          "FINALIZED_INVENTORY_MOVEMENT_IMMUTABLE",
          409,
        );
      }
      const [transfer] = await tx
        .select()
        .from(stockTransferVouchers)
        .where(eq(stockTransferVouchers.voucherId, voucherId))
        .limit(1);
      if (transfer) {
        const items = await tx
          .select()
          .from(stockTransferItems)
          .where(eq(stockTransferItems.transferId, transfer.id));
        const lines = normalizeTransferLines(
          items.map((item) => ({
            sourceLocationId: item.sourceLocationId ?? transfer.sourceLocationId,
            stockItemId: item.stockItemId,
            quantity: item.quantity,
            rate: item.rate,
          })),
          transfer.destinationLocationId,
        );
        const applied = await applyTransfer(
          tx,
          companyId,
          voucherId,
          transfer.destinationLocationId,
          transfer.id,
          lines,
          items,
        );
        const [updated] = await tx
          .update(vouchers)
          .set({
            optional: false,
            totalAmount: scaledIntegerToDecimal(applied.totalMinor, MONEY_SCALE),
          })
          .where(eq(vouchers.id, voucherId))
          .returning();
        return {
          voucher: updated,
          movement: transfer,
          items: applied.items,
          duplicate: false,
        };
      }
      const [adjustment] = await tx
        .select()
        .from(stockAdjustmentVouchers)
        .where(eq(stockAdjustmentVouchers.voucherId, voucherId))
        .limit(1);
      if (!adjustment) {
        integrity("Stock movement not found", "STOCK_MOVEMENT_NOT_FOUND", 404);
      }
      const items = await tx
        .select()
        .from(stockAdjustmentItems)
        .where(eq(stockAdjustmentItems.adjustmentId, adjustment.id));
      const lines = normalizeAdjustmentLines(
        items.map((item) => ({
          stockItemId: item.stockItemId,
          quantity: item.quantity,
          rate: item.rate,
        })),
        adjustment.adjustmentType as AdjustmentKind,
      );
      const applied = await applyAdjustment(
        tx,
        companyId,
        voucherId,
        adjustment.locationId,
        adjustment.id,
        lines,
        items,
      );
      const [updated] = await tx
        .update(vouchers)
        .set({
          optional: false,
          totalAmount: scaledIntegerToDecimal(applied.totalMinor, MONEY_SCALE),
        })
        .where(eq(vouchers.id, voucherId))
        .returning();
      return {
        voucher: updated,
        movement: adjustment,
        items: applied.items,
        duplicate: false,
      };
    });
  }

  reverse(input: {
    companyId: number;
    voucherId: number;
    transactionDate: string;
    reason?: string | null;
    idempotencyKey: string;
    createdBy?: string | null;
  }): Promise<ReversalResult> {
    const identity = validateIdentity(input.idempotencyKey);
    return db.transaction(async (tx) => {
      const [original] = await tx
        .select()
        .from(vouchers)
        .where(and(eq(vouchers.id, input.voucherId), eq(vouchers.companyId, input.companyId)))
        .for("update")
        .limit(1);
      if (!original) integrity("Voucher not found", "VOUCHER_NOT_FOUND", 404);
      if (original.optional) {
        integrity(
          "Optional stock movements have not changed inventory and do not require reversal",
          "OPTIONAL_STOCK_MOVEMENT",
          409,
        );
      }
      const [existingReversal] = await tx
        .select()
        .from(vouchers)
        .where(eq(vouchers.reversalOfVoucherId, original.id))
        .limit(1);
      if (existingReversal) {
        return { voucher: existingReversal, originalVoucher: original, duplicate: true };
      }
      const [transfer] = await tx
        .select({ id: stockTransferVouchers.id })
        .from(stockTransferVouchers)
        .where(eq(stockTransferVouchers.voucherId, original.id))
        .limit(1);
      const [adjustment] = await tx
        .select({ id: stockAdjustmentVouchers.id })
        .from(stockAdjustmentVouchers)
        .where(eq(stockAdjustmentVouchers.voucherId, original.id))
        .limit(1);
      const kind: StockMovementKind | null = transfer
        ? "TRANSFER"
        : adjustment
          ? "ADJUSTMENT"
          : null;
      if (!kind) integrity("Stock movement not found", "STOCK_MOVEMENT_NOT_FOUND", 404);
      const evidence = await tx
        .select()
        .from(stockMovementCostEvidence)
        .where(
          and(
            eq(stockMovementCostEvidence.companyId, input.companyId),
            eq(stockMovementCostEvidence.originalVoucherId, original.id),
            eq(stockMovementCostEvidence.movementKind, kind),
          ),
        )
        .orderBy(stockMovementCostEvidence.id);
      const expectedItems =
        kind === "TRANSFER"
          ? await tx
              .select({ id: stockTransferItems.id })
              .from(stockTransferItems)
              .where(eq(stockTransferItems.transferId, transfer!.id))
          : await tx
              .select({ id: stockAdjustmentItems.id })
              .from(stockAdjustmentItems)
              .where(eq(stockAdjustmentItems.adjustmentId, adjustment!.id));
      if (evidence.length !== expectedItems.length || evidence.length === 0) {
        integrity(
          "This legacy stock movement has no complete exact-cost evidence and cannot be reversed safely",
          "LEGACY_STOCK_COST_UNRESOLVED",
          409,
        );
      }
      if (evidence.some((row) => row.reversedByVoucherId != null)) {
        integrity(
          "Stock movement has already been reversed",
          "STOCK_MOVEMENT_ALREADY_REVERSED",
          409,
        );
      }
      await lockBuckets(
        tx,
        input.companyId,
        evidence.flatMap((row) => [
          ...(row.sourceLocationId
            ? [{ locationId: row.sourceLocationId, stockItemId: row.stockItemId }]
            : []),
          ...(row.destinationLocationId
            ? [{ locationId: row.destinationLocationId, stockItemId: row.stockItemId }]
            : []),
        ]),
      );
      for (const row of evidence) {
        const quantityMinor = decimalToScaledInteger(row.quantity, QUANTITY_SCALE);
        const valueMinor = decimalToScaledInteger(row.actualTotalCost, MONEY_SCALE);
        if (kind === "TRANSFER") {
          const sourceLocationId = row.sourceLocationId;
          const destinationLocationId = row.destinationLocationId;
          if (!sourceLocationId || !destinationLocationId) {
            integrity("Transfer evidence is incomplete", "LEGACY_STOCK_COST_UNRESOLVED");
          }
          const destination = await loadInventory(
            tx,
            input.companyId,
            destinationLocationId,
            row.stockItemId,
          );
          if (
            !destination ||
            destination.quantityMinor < quantityMinor ||
            destination.valueMinor < valueMinor
          ) {
            integrity(
              "Destination inventory has been consumed or revalued and cannot support an exact transfer reversal",
              "STOCK_REVERSAL_INVENTORY_UNAVAILABLE",
              409,
            );
          }
          await writeInventory(
            tx,
            input.companyId,
            destinationLocationId,
            row.stockItemId,
            destination,
            destination.quantityMinor - quantityMinor,
            destination.valueMinor - valueMinor,
          );
          const source = await loadInventory(
            tx,
            input.companyId,
            sourceLocationId,
            row.stockItemId,
          );
          await writeInventory(
            tx,
            input.companyId,
            sourceLocationId,
            row.stockItemId,
            source,
            (source?.quantityMinor ?? 0n) + quantityMinor,
            (source?.valueMinor ?? 0n) + valueMinor,
          );
        } else if (row.sourceLocationId) {
          const current = await loadInventory(
            tx,
            input.companyId,
            row.sourceLocationId,
            row.stockItemId,
          );
          await writeInventory(
            tx,
            input.companyId,
            row.sourceLocationId,
            row.stockItemId,
            current,
            (current?.quantityMinor ?? 0n) + quantityMinor,
            (current?.valueMinor ?? 0n) + valueMinor,
          );
        } else if (row.destinationLocationId) {
          const current = await loadInventory(
            tx,
            input.companyId,
            row.destinationLocationId,
            row.stockItemId,
          );
          if (
            !current ||
            current.quantityMinor < quantityMinor ||
            current.valueMinor < valueMinor
          ) {
            integrity(
              "Produced inventory has been consumed or revalued and cannot support an exact reversal",
              "STOCK_REVERSAL_INVENTORY_UNAVAILABLE",
              409,
            );
          }
          await writeInventory(
            tx,
            input.companyId,
            row.destinationLocationId,
            row.stockItemId,
            current,
            current.quantityMinor - quantityMinor,
            current.valueMinor - valueMinor,
          );
        } else {
          integrity("Adjustment evidence is incomplete", "LEGACY_STOCK_COST_UNRESOLVED");
        }
      }
      const reversalFingerprint = hash({
        originalVoucherId: original.id,
        transactionDate: input.transactionDate,
        reason: input.reason ?? null,
      });
      const [reversal] = await tx
        .insert(vouchers)
        .values({
          companyId: input.companyId,
          locationId: original.locationId,
          locationName: original.locationName,
          voucherNumber: `REV-STOCK-${original.id}-${suffix(identity).slice(0, 8)}`,
          voucherType: kind === "TRANSFER" ? "StockTransferReversal" : "StockAdjustmentReversal",
          voucherDate: normalizeDate(input.transactionDate),
          description: input.reason ?? `Exact reversal of ${original.voucherNumber}`,
          totalAmount: original.totalAmount,
          currency: original.currency,
          exchangeRate: original.exchangeRate,
          sourceType: "ATOMIC_STOCK_REVERSAL",
          sourceId: `${kind}:${original.id}`,
          idempotencyKey: identity,
          idempotencyFingerprint: reversalFingerprint,
          reversalOfVoucherId: original.id,
          createdBy: input.createdBy ?? null,
          optional: false,
        })
        .returning();
      await tx
        .update(stockMovementCostEvidence)
        .set({ reversedByVoucherId: reversal.id })
        .where(eq(stockMovementCostEvidence.originalVoucherId, original.id));
      const [updatedOriginal] = await tx
        .update(vouchers)
        .set({ reversedAt: new Date() })
        .where(eq(vouchers.id, original.id))
        .returning();
      return { voucher: reversal, originalVoucher: updatedOriginal, duplicate: false };
    });
  }
}

export const stockMovementService = new StockMovementService();
