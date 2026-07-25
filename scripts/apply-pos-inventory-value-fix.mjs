import fs from "node:fs";

const path = "server/services/accounting/posSaleCorrectionService.ts";
let source = fs.readFileSync(path, "utf8");

const restoreStart = source.indexOf("async function restoreOriginalInventory(");
const restoreEnd = source.indexOf("\nasync function createReplacementItems(", restoreStart);
if (restoreStart < 0 || restoreEnd < 0) {
  throw new Error("POS inventory restoration function anchors were not found");
}

const restoredBlock = `export function calculateInventoryMovementState(
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
    averageRate = (numerator < 0n) !== (nextQuantity < 0n) ? -rounded : rounded;
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
      .set({
        ...state,
        lastUpdated: new Date(),
      })
      .where(eq(inventory.id, row.id));
    lockedRows.set(stockItemId, { ...row, ...state });
  }
}
`;
source = `${source.slice(0, restoreStart)}${restoredBlock}${source.slice(restoreEnd)}`;

const rowsAnchor = "  const rows: SaleItemRow[] = [];\n  let totalCents = 0n;";
if (!source.includes(rowsAnchor)) throw new Error("POS replacement totals anchor was not found");
source = source.replace(
  rowsAnchor,
  `${rowsAnchor}\n  const requestedCosts = new Map<number, bigint>();`,
);

const costAnchor = "    const totalCost = lineAmount(quantity, costCents);";
if (!source.includes(costAnchor)) throw new Error("POS line cost anchor was not found");
source = source.replace(
  costAnchor,
  `${costAnchor}\n    requestedCosts.set(\n      requested.stockItemId,\n      (requestedCosts.get(requested.stockItemId) ?? 0n) + totalCost,\n    );`,
);

const finalLoopStart = source.indexOf(
  "  for (const [stockItemId, requestedQuantity] of requestedTotals) {",
  source.indexOf("  const rows: SaleItemRow[] = [];"),
);
const returnAnchor = source.indexOf("\n\n  return { rows, totalCents };", finalLoopStart);
if (finalLoopStart < 0 || returnAnchor < 0) {
  throw new Error("POS inventory deduction loop anchors were not found");
}
const finalLoop = `  for (const [stockItemId, requestedQuantity] of requestedTotals) {
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
      .set({
        ...state,
        lastUpdated: new Date(),
      })
      .where(eq(inventory.id, row.id));
    lockedRows.set(stockItemId, { ...row, ...state });
  }`;
source = `${source.slice(0, finalLoopStart)}${finalLoop}${source.slice(returnAnchor)}`;

const cancelTypeAnchor = `      if (original.voucher.voucherType !== "Sales") {
        throw new AccountingIntegrityError(
          "Only sales vouchers can use POS cancellation",
          "VOUCHER_TYPE_MISMATCH",
          409,
        );
      }`;
if (!source.includes(cancelTypeAnchor)) throw new Error("POS cancellation type anchor was not found");
source = source.replace(
  cancelTypeAnchor,
  `${cancelTypeAnchor}\n      if (original.voucher.optional) {\n        throw new AccountingIntegrityError(\n          "Draft POS sales must use the draft workflow",\n          "DRAFT_REQUIRES_EDIT",\n          409,\n        );\n      }`,
);

const cancelItemsAnchor = `      const originalItems = await tx
        .select()
        .from(salesItems)
        .where(eq(salesItems.voucherId, input.voucherId));`;
const cancelItemsPosition = source.lastIndexOf(cancelItemsAnchor);
if (cancelItemsPosition < 0) throw new Error("POS cancellation items anchor was not found");
const insertionPosition = cancelItemsPosition + cancelItemsAnchor.length;
source = `${source.slice(0, insertionPosition)}\n      if (originalItems.length === 0) {\n        throw new AccountingIntegrityError(\n          "POS voucher has no sale items",\n          "POS_ITEMS_NOT_FOUND",\n          409,\n        );\n      }${source.slice(insertionPosition)}`;

fs.writeFileSync(path, source);
