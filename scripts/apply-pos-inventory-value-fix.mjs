import fs from "node:fs";

const path = "server/services/accounting/posSaleCorrectionService.ts";
let source = fs.readFileSync(path, "utf8");

const canonicalInventoryBlock = `export function calculateInventoryMovementState(
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
      .set({ ...state, lastUpdated: new Date() })
      .where(eq(inventory.id, row.id));
    lockedRows.set(stockItemId, { ...row, ...state });
  }
}
`;

const helperStartCandidates = [
  source.indexOf("export function calculateInventoryMovementState("),
  source.indexOf("async function restoreOriginalInventory("),
].filter((position) => position >= 0);
const helperStart = Math.min(...helperStartCandidates);
const helperEnd = source.indexOf("\nasync function createReplacementItems(", helperStart);
if (!Number.isFinite(helperStart) || helperEnd < 0) {
  throw new Error("POS inventory helper anchors were not found");
}
source = `${source.slice(0, helperStart)}${canonicalInventoryBlock}${source.slice(helperEnd)}`;

source = source.replace(
  /  const rows: SaleItemRow\[\] = \[\];\n  let totalCents = 0n;(?:\n  const requestedCosts = new Map<number, bigint>\(\);)*/,
  "  const rows: SaleItemRow[] = [];\n  let totalCents = 0n;\n  const requestedCosts = new Map<number, bigint>();",
);

const totalCostAnchor = "    const totalCost = lineAmount(quantity, costCents);";
const createdAnchor = "    const [created] = await tx";
const totalCostPosition = source.indexOf(totalCostAnchor);
const createdPosition = source.indexOf(createdAnchor, totalCostPosition);
if (totalCostPosition < 0 || createdPosition < 0) {
  throw new Error("POS requested-cost anchors were not found");
}
source = `${source.slice(0, totalCostPosition + totalCostAnchor.length)}\n    requestedCosts.set(\n      requested.stockItemId,\n      (requestedCosts.get(requested.stockItemId) ?? 0n) + totalCost,\n    );\n${source.slice(createdPosition)}`;

const finalLoopStart = source.indexOf(
  "  for (const [stockItemId, requestedQuantity] of requestedTotals) {",
  source.indexOf("  const rows: SaleItemRow[] = [];"),
);
const returnAnchor = source.indexOf("\n\n  return { rows, totalCents };", finalLoopStart);
if (finalLoopStart < 0 || returnAnchor < 0) {
  throw new Error("POS inventory deduction loop anchors were not found");
}
const canonicalFinalLoop = `  for (const [stockItemId, requestedQuantity] of requestedTotals) {
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
  }`;
source = `${source.slice(0, finalLoopStart)}${canonicalFinalLoop}${source.slice(returnAnchor)}`;

const optionalBlock = `      if (original.voucher.optional) {
        throw new AccountingIntegrityError(
          "Draft POS sales must use the draft workflow",
          "DRAFT_REQUIRES_EDIT",
          409,
        );
      }`;
const cancelTypeMessage = '"Only sales vouchers can use POS cancellation"';
const cancelTypePosition = source.indexOf(cancelTypeMessage);
const reversedPosition = source.indexOf("      if (original.voucher.reversedAt) {", cancelTypePosition);
if (cancelTypePosition < 0 || reversedPosition < 0) {
  throw new Error("POS cancellation draft-check anchors were not found");
}
const cancellationPrefix = source.slice(0, cancelTypePosition);
let cancellationRegion = source.slice(cancelTypePosition, reversedPosition);
cancellationRegion = cancellationRegion.replace(
  /(?:\n      if \(original\.voucher\.optional\) \{[\s\S]*?\n      \})+/g,
  "",
);
cancellationRegion = `${cancellationRegion.trimEnd()}\n${optionalBlock}\n`;
source = `${cancellationPrefix}${cancellationRegion}${source.slice(reversedPosition)}`;

const cancellationItemsQuery = `      const originalItems = await tx
        .select()
        .from(salesItems)
        .where(eq(salesItems.voucherId, input.voucherId));`;
const cancellationItemsPosition = source.lastIndexOf(cancellationItemsQuery);
const stockIdsPosition = source.indexOf(
  "      const stockIds = [...new Set(originalItems.map((item) => item.stockItemId))];",
  cancellationItemsPosition,
);
if (cancellationItemsPosition < 0 || stockIdsPosition < 0) {
  throw new Error("POS cancellation item-check anchors were not found");
}
const emptyItemsBlock = `      if (originalItems.length === 0) {
        throw new AccountingIntegrityError(
          "POS voucher has no sale items",
          "POS_ITEMS_NOT_FOUND",
          409,
        );
      }
`;
source = `${source.slice(0, cancellationItemsPosition + cancellationItemsQuery.length)}\n${emptyItemsBlock}${source.slice(stockIdsPosition)}`;

fs.writeFileSync(path, source);
