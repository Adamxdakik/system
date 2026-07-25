import { createHash } from "node:crypto";
import { and, eq, inArray, or } from "drizzle-orm";
import { bigserial, integer, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

import { db } from "../../db";
import { stockItemCodeAliases, stockItems } from "@shared/schema";
import { decimalToScaledInteger, scaledIntegerToDecimal } from "./money";
import { AccountingIntegrityError } from "./voucherPostingService";

const openingBalanceImportRuns = pgTable("opening_balance_import_runs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  companyId: integer("company_id").notNull(),
  importType: varchar("import_type", { length: 100 }).notNull(),
  idempotencyKey: varchar("idempotency_key", { length: 200 }).notNull(),
  payloadHash: varchar("payload_hash", { length: 64 }).notNull(),
  rowCount: integer("row_count").notNull(),
  resultJson: jsonb("result_json").notNull(),
  createdBy: varchar("created_by", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export interface StockOpeningBalanceInput {
  barcode: string;
  openingQty?: string | number | null;
  openingRate?: string | number | null;
  openingValue?: string | number | null;
}

export interface StockOpeningBalanceImportInput {
  companyId: number;
  openingBalances: StockOpeningBalanceInput[];
  idempotencyKey: string;
  createdBy?: string | null;
}

export interface StockOpeningBalanceImportResult {
  updated: number;
  rowCount: number;
  payloadHash: string;
  duplicate: boolean;
  stockItemIds: number[];
}

interface NormalizedRow {
  barcode: string;
  normalizedBarcode: string;
  quantity: string;
  rate: string;
  value: string;
}

function roundDivide(numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator / 2n) / denominator;
}

function normalizeRows(rows: StockOpeningBalanceInput[]): NormalizedRow[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AccountingIntegrityError(
      "Opening-balance import requires at least one row",
      "OPENING_BALANCE_ROWS_REQUIRED",
      400,
    );
  }

  const seenBarcodes = new Set<string>();
  return rows.map((row, index) => {
    const barcode = String(row.barcode ?? "").trim();
    const normalizedBarcode = barcode.toLowerCase();
    if (!barcode) {
      throw new AccountingIntegrityError(
        `Opening-balance row ${index + 1} is missing a barcode`,
        "INVALID_OPENING_BALANCE_ROW",
      );
    }
    if (seenBarcodes.has(normalizedBarcode)) {
      throw new AccountingIntegrityError(
        `Barcode ${barcode} appears more than once in the import`,
        "DUPLICATE_OPENING_BALANCE_BARCODE",
        409,
      );
    }
    seenBarcodes.add(normalizedBarcode);

    const quantityMinor = decimalToScaledInteger(String(row.openingQty ?? "0"), 3);
    const rateMinor = decimalToScaledInteger(String(row.openingRate ?? "0"), 2);
    let valueMinor = decimalToScaledInteger(String(row.openingValue ?? "0"), 2);
    if (quantityMinor < 0n || rateMinor < 0n || valueMinor < 0n) {
      throw new AccountingIntegrityError(
        `Opening-balance row ${index + 1} contains a negative amount`,
        "NEGATIVE_OPENING_BALANCE",
      );
    }
    if (valueMinor === 0n && quantityMinor > 0n && rateMinor > 0n) {
      valueMinor = roundDivide(quantityMinor * rateMinor, 1000n);
    }

    return {
      barcode,
      normalizedBarcode,
      quantity: scaledIntegerToDecimal(quantityMinor, 3),
      rate: scaledIntegerToDecimal(rateMinor, 2),
      value: scaledIntegerToDecimal(valueMinor, 2),
    };
  });
}

function payloadHash(rows: NormalizedRow[]): string {
  const canonical = [...rows]
    .sort((left, right) => left.normalizedBarcode.localeCompare(right.normalizedBarcode))
    .map(({ normalizedBarcode, quantity, rate, value }) => ({
      barcode: normalizedBarcode,
      quantity,
      rate,
      value,
    }));
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

function parseStoredResult(value: unknown): StockOpeningBalanceImportResult {
  const result = value as Omit<StockOpeningBalanceImportResult, "duplicate">;
  return { ...result, duplicate: true };
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "23505"
  );
}

async function loadExisting(
  companyId: number,
  idempotencyKey: string,
  hash: string,
): Promise<StockOpeningBalanceImportResult | null> {
  const [existing] = await db
    .select({ payloadHash: openingBalanceImportRuns.payloadHash, result: openingBalanceImportRuns.resultJson })
    .from(openingBalanceImportRuns)
    .where(
      and(
        eq(openingBalanceImportRuns.companyId, companyId),
        eq(openingBalanceImportRuns.importType, "STOCK_OPENING_BALANCE"),
        or(
          eq(openingBalanceImportRuns.idempotencyKey, idempotencyKey),
          eq(openingBalanceImportRuns.payloadHash, hash),
        ),
      ),
    )
    .limit(1);
  if (!existing) return null;
  if (existing.payloadHash !== hash) {
    throw new AccountingIntegrityError(
      "Opening-balance idempotency key was reused for different content",
      "OPENING_BALANCE_IDEMPOTENCY_CONFLICT",
      409,
    );
  }
  return parseStoredResult(existing.result);
}

export class OpeningBalanceImportService {
  async importStockOpeningBalances(
    input: StockOpeningBalanceImportInput,
  ): Promise<StockOpeningBalanceImportResult> {
    const normalizedRows = normalizeRows(input.openingBalances);
    const hash = payloadHash(normalizedRows);
    const existing = await loadExisting(input.companyId, input.idempotencyKey, hash);
    if (existing) return existing;

    try {
      return await db.transaction(async (tx) => {
        const items = await tx
          .select()
          .from(stockItems)
          .where(eq(stockItems.companyId, input.companyId));
        const aliases = await tx
          .select()
          .from(stockItemCodeAliases)
          .where(eq(stockItemCodeAliases.companyId, input.companyId));

        const itemById = new Map(items.map((item) => [item.id, item]));
        const lookup = new Map<string, (typeof items)[number]>();
        for (const item of items) {
          if (item.code) lookup.set(item.code.trim().toLowerCase(), item);
        }
        for (const alias of aliases) {
          const item = itemById.get(alias.stockItemId);
          if (item && alias.aliasCode) {
            lookup.set(alias.aliasCode.trim().toLowerCase(), item);
          }
        }

        const missing: string[] = [];
        const resolved = normalizedRows.map((row) => {
          const item = lookup.get(row.normalizedBarcode);
          if (!item) missing.push(row.barcode);
          return { row, item };
        });
        if (missing.length > 0) {
          throw new AccountingIntegrityError(
            `Opening-balance import contains unknown barcodes: ${missing.slice(0, 20).join(", ")}${missing.length > 20 ? "..." : ""}`,
            "OPENING_BALANCE_ITEMS_NOT_FOUND",
            422,
          );
        }

        const resolvedIds = resolved.map(({ item }) => item!.id);
        if (new Set(resolvedIds).size !== resolvedIds.length) {
          throw new AccountingIntegrityError(
            "Multiple import rows resolve to the same stock item",
            "DUPLICATE_OPENING_BALANCE_ITEM",
            409,
          );
        }

        if (resolvedIds.length > 0) {
          await tx
            .select({ id: stockItems.id })
            .from(stockItems)
            .where(
              and(
                eq(stockItems.companyId, input.companyId),
                inArray(stockItems.id, resolvedIds),
              ),
            )
            .for("update");
        }

        for (const { row, item } of resolved) {
          await tx
            .update(stockItems)
            .set({
              openingQty: row.quantity,
              openingRate: row.rate,
              openingValue: row.value,
            })
            .where(and(eq(stockItems.id, item!.id), eq(stockItems.companyId, input.companyId)));
        }

        const result: StockOpeningBalanceImportResult = {
          updated: resolved.length,
          rowCount: normalizedRows.length,
          payloadHash: hash,
          duplicate: false,
          stockItemIds: resolvedIds,
        };
        await tx.insert(openingBalanceImportRuns).values({
          companyId: input.companyId,
          importType: "STOCK_OPENING_BALANCE",
          idempotencyKey: input.idempotencyKey,
          payloadHash: hash,
          rowCount: normalizedRows.length,
          resultJson: result,
          createdBy: input.createdBy,
        });
        return result;
      });
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      const concurrent = await loadExisting(input.companyId, input.idempotencyKey, hash);
      if (concurrent) return concurrent;
      throw error;
    }
  }
}
