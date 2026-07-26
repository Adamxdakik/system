import type { Express } from "express";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import {
  containerOffloads,
  containers,
  inventory,
  locations,
  poLineItems,
  purchaseOrders,
  salesItems,
  stockAdjustmentItems,
  stockAdjustmentVouchers,
  stockTransferItems,
  stockTransferVouchers,
  vouchers,
} from "@shared/schema";
import { requireAuth } from "../auth";
import { db } from "../db";
import { storage } from "../storage";
import {
  buildWeightedStockHistory,
  MONTH_NAMES,
  monthWindow,
  numericValue,
  type StockHistoryTransaction,
} from "../services/performance/heavyReadCalculations";

interface AggregateRow {
  quantity: unknown;
  value: unknown;
}

interface LocationMovementRow {
  inwardQty: unknown;
  inwardValue: unknown;
  outwardQty: unknown;
  outwardValue: unknown;
}

interface NetMovementRow {
  quantity: unknown;
  value: unknown;
}

const inFlightStockHistory = new Map<string, Promise<unknown>>();

function aggregate(row: AggregateRow | undefined): { quantity: number; value: number } {
  return {
    quantity: numericValue(row?.quantity),
    value: numericValue(row?.value),
  };
}

function locationMovement(row: LocationMovementRow | undefined) {
  return {
    inwardQty: numericValue(row?.inwardQty),
    inwardValue: numericValue(row?.inwardValue),
    outwardQty: numericValue(row?.outwardQty),
    outwardValue: numericValue(row?.outwardValue),
  };
}

function netMovement(row: NetMovementRow | undefined) {
  return {
    quantity: numericValue(row?.quantity),
    value: numericValue(row?.value),
  };
}

function coalesce<T>(key: string, load: () => Promise<T>): Promise<T> {
  const existing = inFlightStockHistory.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const request = load().finally(() => {
    if (inFlightStockHistory.get(key) === request) inFlightStockHistory.delete(key);
  });
  inFlightStockHistory.set(key, request);
  return request;
}

async function loadLocationNames(
  companyId: number,
  ids: Iterable<number>,
): Promise<Record<number, string>> {
  const uniqueIds = [...new Set(ids)].filter((id) => Number.isInteger(id) && id > 0);
  if (uniqueIds.length === 0) return {};

  const rows = await db
    .select({ id: locations.id, name: locations.name })
    .from(locations)
    .where(and(eq(locations.companyId, companyId), inArray(locations.id, uniqueIds)));
  return Object.fromEntries(rows.map((row) => [row.id, row.name]));
}

async function loadCompanyStockHistory(
  companyId: number,
  stockItemId: number,
  year: number,
  month: number,
) {
  const stockItem = await storage.getStockItemById(stockItemId);
  if (!stockItem) throw Object.assign(new Error("Stock item not found"), { status: 404 });

  const { monthStartDate, nextMonthStartDate } = monthWindow(year, month);
  const beforeMonth = (column: unknown) => sql`${column}::date < ${monthStartDate}::date`;
  const inMonth = (column: unknown) =>
    sql`${column}::date >= ${monthStartDate}::date AND ${column}::date < ${nextMonthStartDate}::date`;

  const [priorPOResult, priorAdjustmentResult, priorSalesResult] = await Promise.all([
    db
      .select({
        quantity: sql<string>`COALESCE(SUM(${poLineItems.quantity}::numeric), 0)`,
        value: sql<string>`COALESCE(SUM(${poLineItems.lineTotal}::numeric), 0)`,
      })
      .from(poLineItems)
      .innerJoin(purchaseOrders, eq(poLineItems.poId, purchaseOrders.id))
      .innerJoin(containers, eq(purchaseOrders.containerId, containers.id))
      .where(
        and(
          eq(poLineItems.stockItemId, stockItemId),
          eq(purchaseOrders.companyId, companyId),
          beforeMonth(purchaseOrders.createdAt),
        ),
      ),
    db
      .select({
        quantity: sql<string>`COALESCE(SUM(${stockAdjustmentItems.quantity}::numeric), 0)`,
        value: sql<string>`COALESCE(SUM(${stockAdjustmentItems.totalAmount}::numeric), 0)`,
      })
      .from(stockAdjustmentItems)
      .innerJoin(
        stockAdjustmentVouchers,
        eq(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id),
      )
      .innerJoin(vouchers, eq(stockAdjustmentVouchers.voucherId, vouchers.id))
      .where(
        and(
          eq(stockAdjustmentItems.stockItemId, stockItemId),
          eq(vouchers.companyId, companyId),
          eq(vouchers.optional, false),
          beforeMonth(vouchers.voucherDate),
        ),
      ),
    db
      .select({
        quantity: sql<string>`COALESCE(SUM(${salesItems.quantity}::numeric), 0)`,
        value: sql<string>`COALESCE(SUM(${salesItems.totalCost}::numeric), 0)`,
      })
      .from(salesItems)
      .innerJoin(vouchers, eq(salesItems.voucherId, vouchers.id))
      .where(
        and(
          eq(salesItems.stockItemId, stockItemId),
          eq(vouchers.companyId, companyId),
          eq(vouchers.optional, false),
          beforeMonth(vouchers.voucherDate),
        ),
      ),
  ]);

  const priorPO = aggregate(priorPOResult[0]);
  const priorAdjustment = aggregate(priorAdjustmentResult[0]);
  const priorSales = aggregate(priorSalesResult[0]);
  const openingQty = priorPO.quantity + priorAdjustment.quantity - priorSales.quantity;
  const openingValue = priorPO.value + priorAdjustment.value - priorSales.value;

  const [poItems, transferItems, adjustmentItems, salesData] = await Promise.all([
    db
      .select({
        date: purchaseOrders.createdAt,
        poId: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        containerNumber: containers.containerNumber,
        quantity: poLineItems.quantity,
        rate: poLineItems.rate,
        lineTotal: poLineItems.lineTotal,
      })
      .from(poLineItems)
      .innerJoin(purchaseOrders, eq(poLineItems.poId, purchaseOrders.id))
      .innerJoin(containers, eq(purchaseOrders.containerId, containers.id))
      .where(
        and(
          eq(poLineItems.stockItemId, stockItemId),
          eq(purchaseOrders.companyId, companyId),
          inMonth(purchaseOrders.createdAt),
        ),
      )
      .orderBy(purchaseOrders.createdAt),
    db
      .select({
        voucherDate: vouchers.voucherDate,
        voucherId: vouchers.id,
        quantity: stockTransferItems.quantity,
        rate: stockTransferItems.rate,
        totalAmount: stockTransferItems.totalAmount,
        sourceLocationId: stockTransferItems.sourceLocationId,
        destinationLocationId: stockTransferVouchers.destinationLocationId,
      })
      .from(stockTransferItems)
      .innerJoin(stockTransferVouchers, eq(stockTransferItems.transferId, stockTransferVouchers.id))
      .innerJoin(vouchers, eq(stockTransferVouchers.voucherId, vouchers.id))
      .where(
        and(
          eq(stockTransferItems.stockItemId, stockItemId),
          eq(vouchers.companyId, companyId),
          eq(vouchers.optional, false),
          inMonth(vouchers.voucherDate),
        ),
      )
      .orderBy(vouchers.voucherDate),
    db
      .select({
        voucherDate: vouchers.voucherDate,
        voucherId: vouchers.id,
        quantity: stockAdjustmentItems.quantity,
        rate: stockAdjustmentItems.rate,
        totalAmount: stockAdjustmentItems.totalAmount,
        adjustmentType: stockAdjustmentVouchers.adjustmentType,
        locationId: stockAdjustmentVouchers.locationId,
      })
      .from(stockAdjustmentItems)
      .innerJoin(
        stockAdjustmentVouchers,
        eq(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id),
      )
      .innerJoin(vouchers, eq(stockAdjustmentVouchers.voucherId, vouchers.id))
      .where(
        and(
          eq(stockAdjustmentItems.stockItemId, stockItemId),
          eq(vouchers.companyId, companyId),
          eq(vouchers.optional, false),
          inMonth(vouchers.voucherDate),
        ),
      )
      .orderBy(vouchers.voucherDate),
    db
      .select({
        voucherDate: vouchers.voucherDate,
        voucherId: vouchers.id,
        locationId: vouchers.locationId,
        locationName: vouchers.locationName,
        quantity: salesItems.quantity,
        sellingPrice: salesItems.sellingPrice,
        totalSales: salesItems.totalSales,
      })
      .from(salesItems)
      .innerJoin(vouchers, eq(salesItems.voucherId, vouchers.id))
      .where(
        and(
          eq(salesItems.stockItemId, stockItemId),
          eq(vouchers.companyId, companyId),
          eq(vouchers.optional, false),
          inMonth(vouchers.voucherDate),
        ),
      )
      .orderBy(vouchers.voucherDate),
  ]);

  const locationIds: number[] = [];
  for (const item of transferItems) {
    if (item.sourceLocationId) locationIds.push(item.sourceLocationId);
    if (item.destinationLocationId) locationIds.push(item.destinationLocationId);
  }
  for (const item of adjustmentItems) if (item.locationId) locationIds.push(item.locationId);
  for (const item of salesData) if (item.locationId) locationIds.push(item.locationId);
  const locationMap = await loadLocationNames(companyId, locationIds);

  const transactions: StockHistoryTransaction[] = [];
  for (const item of poItems) {
    transactions.push({
      date: item.date.toISOString().split("T")[0],
      particulars: item.containerNumber,
      vchType: "PURCHASE IMPORT",
      voucherId: 0,
      poId: item.poId,
      inwardQty: numericValue(item.quantity),
      inwardRate: numericValue(item.rate),
      inwardValue: numericValue(item.lineTotal),
      outwardQty: 0,
      outwardRate: 0,
      outwardValue: 0,
    });
  }
  for (const item of transferItems) {
    const quantity = numericValue(item.quantity);
    const rate = numericValue(item.rate);
    const value = numericValue(item.totalAmount);
    const sourceName = item.sourceLocationId
      ? locationMap[item.sourceLocationId] || "Unknown"
      : "Unknown";
    const destinationName = locationMap[item.destinationLocationId] || "Unknown";
    transactions.push({
      date: item.voucherDate,
      particulars: `To ${destinationName}`,
      vchType: `Stock Transfer - ${sourceName}`,
      voucherId: item.voucherId,
      inwardQty: 0,
      inwardRate: 0,
      inwardValue: 0,
      outwardQty: quantity,
      outwardRate: rate,
      outwardValue: value,
    });
    transactions.push({
      date: item.voucherDate,
      particulars: `From ${sourceName}`,
      vchType: `Stock Transfer - ${destinationName}`,
      voucherId: item.voucherId,
      inwardQty: quantity,
      inwardRate: rate,
      inwardValue: value,
      outwardQty: 0,
      outwardRate: 0,
      outwardValue: 0,
    });
  }
  for (const item of adjustmentItems) {
    const rawQuantity = numericValue(item.quantity);
    const rawValue = numericValue(item.totalAmount);
    const isProduction = rawQuantity > 0;
    const quantity = Math.abs(rawQuantity);
    const value = Math.abs(rawValue);
    transactions.push({
      date: item.voucherDate,
      particulars: locationMap[item.locationId] || "Unknown",
      vchType: isProduction ? "Production" : "Consumption",
      voucherId: item.voucherId,
      inwardQty: isProduction ? quantity : 0,
      inwardRate: isProduction ? numericValue(item.rate) : 0,
      inwardValue: isProduction ? rawValue : 0,
      outwardQty: isProduction ? 0 : quantity,
      outwardRate: isProduction ? 0 : numericValue(item.rate),
      outwardValue: isProduction ? 0 : value,
    });
  }
  for (const item of salesData) {
    const locationName =
      item.locationName || (item.locationId ? locationMap[item.locationId] : null) || "Cash";
    transactions.push({
      date: item.voucherDate,
      particulars: locationName,
      vchType: `POS - ${locationName}`,
      voucherId: item.voucherId,
      inwardQty: 0,
      inwardRate: 0,
      inwardValue: 0,
      outwardQty: numericValue(item.quantity),
      outwardRate: 0,
      outwardValue: 0,
      isPOS: true,
      posSellingRate: numericValue(item.sellingPrice),
      posSellingValue: numericValue(item.totalSales),
    });
  }

  transactions.sort(
    (left, right) => new Date(left.date).getTime() - new Date(right.date).getTime(),
  );
  const history = buildWeightedStockHistory({
    openingDate: monthStartDate,
    openingQty,
    openingValue,
    openingRowMode: "closing-only",
    transactions,
  });
  const openingRate = openingQty > 0 ? openingValue / openingQty : 0;

  return {
    stockItem,
    year,
    month,
    monthName: MONTH_NAMES[month - 1],
    openingBalance: { qty: openingQty, rate: openingRate, value: openingValue },
    transactions: history.transactions,
    totals: history.totals,
  };
}

async function loadLocationStockHistory(
  companyId: number,
  locationId: number,
  stockItemId: number,
  year: number,
  month: number,
) {
  const [stockItem, location] = await Promise.all([
    storage.getStockItemById(stockItemId),
    storage.getLocationById(locationId),
  ]);
  if (!stockItem) throw Object.assign(new Error("Stock item not found"), { status: 404 });
  if (!location) throw Object.assign(new Error("Location not found"), { status: 404 });

  const { monthStartDate, nextMonthStartDate } = monthWindow(year, month);
  const beforeMonth = (column: unknown) => sql`${column}::date < ${monthStartDate}::date`;
  const afterMonth = (column: unknown) => sql`${column}::date >= ${nextMonthStartDate}::date`;
  const inMonth = (column: unknown) =>
    sql`${column}::date >= ${monthStartDate}::date AND ${column}::date < ${nextMonthStartDate}::date`;
  const transferAtLocation = or(
    eq(stockTransferItems.sourceLocationId, locationId),
    eq(stockTransferVouchers.destinationLocationId, locationId),
  );

  const [
    priorTransferResult,
    priorAdjustmentResult,
    priorSalesResult,
    priorOffloadResult,
    currentInventoryResult,
  ] = await Promise.all([
    db
      .select({
        inwardQty: sql<string>`COALESCE(SUM(CASE WHEN ${stockTransferVouchers.destinationLocationId} = ${locationId} THEN ${stockTransferItems.quantity}::numeric ELSE 0 END), 0)`,
        inwardValue: sql<string>`COALESCE(SUM(CASE WHEN ${stockTransferVouchers.destinationLocationId} = ${locationId} THEN ${stockTransferItems.totalAmount}::numeric ELSE 0 END), 0)`,
        outwardQty: sql<string>`COALESCE(SUM(CASE WHEN ${stockTransferItems.sourceLocationId} = ${locationId} THEN ${stockTransferItems.quantity}::numeric ELSE 0 END), 0)`,
        outwardValue: sql<string>`COALESCE(SUM(CASE WHEN ${stockTransferItems.sourceLocationId} = ${locationId} THEN ${stockTransferItems.totalAmount}::numeric ELSE 0 END), 0)`,
      })
      .from(stockTransferItems)
      .innerJoin(stockTransferVouchers, eq(stockTransferItems.transferId, stockTransferVouchers.id))
      .innerJoin(vouchers, eq(stockTransferVouchers.voucherId, vouchers.id))
      .where(
        and(
          eq(stockTransferItems.stockItemId, stockItemId),
          eq(vouchers.companyId, companyId),
          eq(vouchers.optional, false),
          beforeMonth(vouchers.voucherDate),
          transferAtLocation,
        ),
      ),
    db
      .select({
        inwardQty: sql<string>`COALESCE(SUM(CASE WHEN ${stockAdjustmentItems.quantity}::numeric > 0 THEN ${stockAdjustmentItems.quantity}::numeric ELSE 0 END), 0)`,
        inwardValue: sql<string>`COALESCE(SUM(CASE WHEN ${stockAdjustmentItems.quantity}::numeric > 0 THEN ${stockAdjustmentItems.totalAmount}::numeric ELSE 0 END), 0)`,
        outwardQty: sql<string>`COALESCE(SUM(CASE WHEN ${stockAdjustmentItems.quantity}::numeric < 0 THEN ABS(${stockAdjustmentItems.quantity}::numeric) ELSE 0 END), 0)`,
        outwardValue: sql<string>`COALESCE(SUM(CASE WHEN ${stockAdjustmentItems.quantity}::numeric < 0 THEN ABS(${stockAdjustmentItems.totalAmount}::numeric) ELSE 0 END), 0)`,
      })
      .from(stockAdjustmentItems)
      .innerJoin(
        stockAdjustmentVouchers,
        eq(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id),
      )
      .innerJoin(vouchers, eq(stockAdjustmentVouchers.voucherId, vouchers.id))
      .where(
        and(
          eq(stockAdjustmentItems.stockItemId, stockItemId),
          eq(vouchers.companyId, companyId),
          eq(vouchers.optional, false),
          eq(stockAdjustmentVouchers.locationId, locationId),
          beforeMonth(vouchers.voucherDate),
        ),
      ),
    db
      .select({
        quantity: sql<string>`COALESCE(SUM(${salesItems.quantity}::numeric), 0)`,
        value: sql<string>`COALESCE(SUM(${salesItems.totalCost}::numeric), 0)`,
      })
      .from(salesItems)
      .innerJoin(vouchers, eq(salesItems.voucherId, vouchers.id))
      .where(
        and(
          eq(salesItems.stockItemId, stockItemId),
          eq(vouchers.companyId, companyId),
          eq(vouchers.optional, false),
          eq(vouchers.locationId, locationId),
          beforeMonth(vouchers.voucherDate),
        ),
      ),
    db
      .select({
        quantity: sql<string>`COALESCE(SUM(${poLineItems.quantity}::numeric), 0)`,
        value: sql<string>`COALESCE(SUM(${poLineItems.lineTotal}::numeric + COALESCE(${containerOffloads.additionalCostPerMoto}::numeric, 0) * ${poLineItems.quantity}::numeric), 0)`,
      })
      .from(containerOffloads)
      .innerJoin(containers, eq(containerOffloads.containerId, containers.id))
      .innerJoin(purchaseOrders, eq(purchaseOrders.containerId, containers.id))
      .innerJoin(poLineItems, eq(poLineItems.poId, purchaseOrders.id))
      .where(
        and(
          eq(poLineItems.stockItemId, stockItemId),
          eq(containers.companyId, companyId),
          eq(containerOffloads.locationId, locationId),
          beforeMonth(containerOffloads.offloadedAt),
        ),
      ),
    db
      .select({
        quantity: inventory.quantity,
        averageRate: inventory.averageRate,
        totalValue: inventory.totalValue,
      })
      .from(inventory)
      .where(and(eq(inventory.locationId, locationId), eq(inventory.stockItemId, stockItemId)))
      .limit(1),
  ]);

  const priorTransfer = locationMovement(priorTransferResult[0]);
  const priorAdjustment = locationMovement(priorAdjustmentResult[0]);
  const priorSales = aggregate(priorSalesResult[0]);
  const priorOffload = aggregate(priorOffloadResult[0]);
  const voucherOpeningQty =
    priorTransfer.inwardQty +
    priorAdjustment.inwardQty +
    priorOffload.quantity -
    priorTransfer.outwardQty -
    priorAdjustment.outwardQty -
    priorSales.quantity;
  const voucherOpeningValue =
    priorTransfer.inwardValue +
    priorAdjustment.inwardValue +
    priorOffload.value -
    priorTransfer.outwardValue -
    priorAdjustment.outwardValue -
    priorSales.value;
  const currentInventory = currentInventoryResult[0];
  const currentQty = numericValue(currentInventory?.quantity);
  const currentValue = numericValue(currentInventory?.totalValue);

  const [afterTransferResult, afterAdjustmentResult, afterSalesResult, afterOffloadResult] =
    await Promise.all([
      db
        .select({
          quantity: sql<string>`COALESCE(SUM(
            (CASE WHEN ${stockTransferItems.sourceLocationId} = ${locationId} THEN -${stockTransferItems.quantity}::numeric ELSE 0 END) +
            (CASE WHEN ${stockTransferVouchers.destinationLocationId} = ${locationId} THEN ${stockTransferItems.quantity}::numeric ELSE 0 END)
          ), 0)`,
          value: sql<string>`COALESCE(SUM(
            (CASE WHEN ${stockTransferItems.sourceLocationId} = ${locationId} THEN -${stockTransferItems.totalAmount}::numeric ELSE 0 END) +
            (CASE WHEN ${stockTransferVouchers.destinationLocationId} = ${locationId} THEN ${stockTransferItems.totalAmount}::numeric ELSE 0 END)
          ), 0)`,
        })
        .from(stockTransferItems)
        .innerJoin(
          stockTransferVouchers,
          eq(stockTransferItems.transferId, stockTransferVouchers.id),
        )
        .innerJoin(vouchers, eq(stockTransferVouchers.voucherId, vouchers.id))
        .where(
          and(
            eq(stockTransferItems.stockItemId, stockItemId),
            eq(vouchers.companyId, companyId),
            eq(vouchers.optional, false),
            afterMonth(vouchers.voucherDate),
            transferAtLocation,
          ),
        ),
      db
        .select({
          quantity: sql<string>`COALESCE(SUM(${stockAdjustmentItems.quantity}::numeric), 0)`,
          value: sql<string>`COALESCE(SUM(${stockAdjustmentItems.totalAmount}::numeric), 0)`,
        })
        .from(stockAdjustmentItems)
        .innerJoin(
          stockAdjustmentVouchers,
          eq(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id),
        )
        .innerJoin(vouchers, eq(stockAdjustmentVouchers.voucherId, vouchers.id))
        .where(
          and(
            eq(stockAdjustmentItems.stockItemId, stockItemId),
            eq(vouchers.companyId, companyId),
            eq(vouchers.optional, false),
            eq(stockAdjustmentVouchers.locationId, locationId),
            afterMonth(vouchers.voucherDate),
          ),
        ),
      db
        .select({
          quantity: sql<string>`COALESCE(-SUM(${salesItems.quantity}::numeric), 0)`,
          value: sql<string>`COALESCE(-SUM(${salesItems.totalCost}::numeric), 0)`,
        })
        .from(salesItems)
        .innerJoin(vouchers, eq(salesItems.voucherId, vouchers.id))
        .where(
          and(
            eq(salesItems.stockItemId, stockItemId),
            eq(vouchers.companyId, companyId),
            eq(vouchers.optional, false),
            eq(vouchers.locationId, locationId),
            afterMonth(vouchers.voucherDate),
          ),
        ),
      db
        .select({
          quantity: sql<string>`COALESCE(SUM(${poLineItems.quantity}::numeric), 0)`,
          value: sql<string>`COALESCE(SUM(${poLineItems.lineTotal}::numeric + COALESCE(${containerOffloads.additionalCostPerMoto}::numeric, 0) * ${poLineItems.quantity}::numeric), 0)`,
        })
        .from(containerOffloads)
        .innerJoin(containers, eq(containerOffloads.containerId, containers.id))
        .innerJoin(purchaseOrders, eq(purchaseOrders.containerId, containers.id))
        .innerJoin(poLineItems, eq(poLineItems.poId, purchaseOrders.id))
        .where(
          and(
            eq(poLineItems.stockItemId, stockItemId),
            eq(containers.companyId, companyId),
            eq(containerOffloads.locationId, locationId),
            afterMonth(containerOffloads.offloadedAt),
          ),
        ),
    ]);

  const afterTransfer = netMovement(afterTransferResult[0]);
  const afterAdjustment = netMovement(afterAdjustmentResult[0]);
  const afterSales = netMovement(afterSalesResult[0]);
  const afterOffload = netMovement(afterOffloadResult[0]);
  const afterMonthNetQty =
    afterTransfer.quantity + afterAdjustment.quantity + afterSales.quantity + afterOffload.quantity;
  const afterMonthNetValue =
    afterTransfer.value + afterAdjustment.value + afterSales.value + afterOffload.value;
  const expectedClosingQty = currentQty - afterMonthNetQty;
  const expectedClosingValue = currentValue - afterMonthNetValue;
  const expectedClosingRate =
    expectedClosingQty > 0 ? expectedClosingValue / expectedClosingQty : 0;

  const [transferItems, adjustmentItems, salesData, offloadData] = await Promise.all([
    db
      .select({
        voucherDate: vouchers.voucherDate,
        voucherId: vouchers.id,
        quantity: stockTransferItems.quantity,
        rate: stockTransferItems.rate,
        totalAmount: stockTransferItems.totalAmount,
        sourceLocationId: stockTransferItems.sourceLocationId,
        destinationLocationId: stockTransferVouchers.destinationLocationId,
      })
      .from(stockTransferItems)
      .innerJoin(stockTransferVouchers, eq(stockTransferItems.transferId, stockTransferVouchers.id))
      .innerJoin(vouchers, eq(stockTransferVouchers.voucherId, vouchers.id))
      .where(
        and(
          eq(stockTransferItems.stockItemId, stockItemId),
          eq(vouchers.companyId, companyId),
          eq(vouchers.optional, false),
          inMonth(vouchers.voucherDate),
          transferAtLocation,
        ),
      )
      .orderBy(vouchers.voucherDate),
    db
      .select({
        voucherDate: vouchers.voucherDate,
        voucherId: vouchers.id,
        quantity: stockAdjustmentItems.quantity,
        rate: stockAdjustmentItems.rate,
        totalAmount: stockAdjustmentItems.totalAmount,
      })
      .from(stockAdjustmentItems)
      .innerJoin(
        stockAdjustmentVouchers,
        eq(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id),
      )
      .innerJoin(vouchers, eq(stockAdjustmentVouchers.voucherId, vouchers.id))
      .where(
        and(
          eq(stockAdjustmentItems.stockItemId, stockItemId),
          eq(vouchers.companyId, companyId),
          eq(vouchers.optional, false),
          eq(stockAdjustmentVouchers.locationId, locationId),
          inMonth(vouchers.voucherDate),
        ),
      )
      .orderBy(vouchers.voucherDate),
    db
      .select({
        voucherDate: vouchers.voucherDate,
        voucherId: vouchers.id,
        quantity: salesItems.quantity,
        sellingPrice: salesItems.sellingPrice,
        totalSales: salesItems.totalSales,
      })
      .from(salesItems)
      .innerJoin(vouchers, eq(salesItems.voucherId, vouchers.id))
      .where(
        and(
          eq(salesItems.stockItemId, stockItemId),
          eq(vouchers.companyId, companyId),
          eq(vouchers.optional, false),
          eq(vouchers.locationId, locationId),
          inMonth(vouchers.voucherDate),
        ),
      )
      .orderBy(vouchers.voucherDate),
    db
      .select({
        offloadedAt: containerOffloads.offloadedAt,
        containerCode: containers.containerNumber,
        poId: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        quantity: poLineItems.quantity,
        rate: poLineItems.rate,
        lineTotal: poLineItems.lineTotal,
        additionalCostPerMoto: containerOffloads.additionalCostPerMoto,
      })
      .from(containerOffloads)
      .innerJoin(containers, eq(containerOffloads.containerId, containers.id))
      .innerJoin(purchaseOrders, eq(purchaseOrders.containerId, containers.id))
      .innerJoin(poLineItems, eq(poLineItems.poId, purchaseOrders.id))
      .where(
        and(
          eq(poLineItems.stockItemId, stockItemId),
          eq(containers.companyId, companyId),
          eq(containerOffloads.locationId, locationId),
          inMonth(containerOffloads.offloadedAt),
        ),
      )
      .orderBy(containerOffloads.offloadedAt),
  ]);

  const locationIds: number[] = [];
  for (const item of transferItems) {
    if (item.sourceLocationId) locationIds.push(item.sourceLocationId);
    if (item.destinationLocationId) locationIds.push(item.destinationLocationId);
  }
  const locationMap = await loadLocationNames(companyId, locationIds);
  const transactions: StockHistoryTransaction[] = [];

  for (const item of transferItems) {
    const quantity = numericValue(item.quantity);
    const rate = numericValue(item.rate);
    const value = numericValue(item.totalAmount);
    const sourceName = item.sourceLocationId
      ? locationMap[item.sourceLocationId] || "Unknown"
      : "Unknown";
    const destinationName = locationMap[item.destinationLocationId] || "Unknown";
    if (item.sourceLocationId === locationId) {
      transactions.push({
        date: item.voucherDate,
        particulars: `To ${destinationName}`,
        vchType: "Stock Transfer",
        voucherId: item.voucherId,
        inwardQty: 0,
        inwardRate: 0,
        inwardValue: 0,
        outwardQty: quantity,
        outwardRate: rate,
        outwardValue: value,
      });
    }
    if (item.destinationLocationId === locationId) {
      transactions.push({
        date: item.voucherDate,
        particulars: `From ${sourceName}`,
        vchType: "Stock Transfer",
        voucherId: item.voucherId,
        inwardQty: quantity,
        inwardRate: rate,
        inwardValue: value,
        outwardQty: 0,
        outwardRate: 0,
        outwardValue: 0,
      });
    }
  }
  for (const item of adjustmentItems) {
    const rawQuantity = numericValue(item.quantity);
    const rawValue = numericValue(item.totalAmount);
    const isProduction = rawQuantity > 0;
    transactions.push({
      date: item.voucherDate,
      particulars: isProduction ? "Production" : "Consumption",
      vchType: isProduction ? "Production" : "Consumption",
      voucherId: item.voucherId,
      inwardQty: isProduction ? Math.abs(rawQuantity) : 0,
      inwardRate: isProduction ? numericValue(item.rate) : 0,
      inwardValue: isProduction ? rawValue : 0,
      outwardQty: isProduction ? 0 : Math.abs(rawQuantity),
      outwardRate: isProduction ? 0 : numericValue(item.rate),
      outwardValue: isProduction ? 0 : Math.abs(rawValue),
    });
  }
  for (const item of salesData) {
    transactions.push({
      date: item.voucherDate,
      particulars: "Cash",
      vchType: "POS",
      voucherId: item.voucherId,
      inwardQty: 0,
      inwardRate: 0,
      inwardValue: 0,
      outwardQty: numericValue(item.quantity),
      outwardRate: 0,
      outwardValue: 0,
      isPOS: true,
      posSellingRate: numericValue(item.sellingPrice),
      posSellingValue: numericValue(item.totalSales),
    });
  }
  for (const item of offloadData) {
    const quantity = numericValue(item.quantity);
    const landedValue =
      numericValue(item.lineTotal) + numericValue(item.additionalCostPerMoto) * quantity;
    const offloadDate =
      item.offloadedAt instanceof Date
        ? item.offloadedAt.toISOString().split("T")[0]
        : String(item.offloadedAt).split("T")[0];
    transactions.push({
      date: offloadDate,
      particulars: `Container: ${item.containerCode} / PO: ${item.poNumber}`,
      vchType: "PO Offload",
      voucherId: 0,
      poId: item.poId,
      inwardQty: quantity,
      inwardRate: quantity !== 0 ? landedValue / quantity : 0,
      inwardValue: landedValue,
      outwardQty: 0,
      outwardRate: 0,
      outwardValue: 0,
    });
  }

  transactions.sort((left, right) => {
    const dateCompare = new Date(left.date).getTime() - new Date(right.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    if (left.inwardQty > 0 && right.outwardQty > 0) return -1;
    if (left.outwardQty > 0 && right.inwardQty > 0) return 1;
    return 0;
  });

  const inMonthInwardQty = transactions.reduce((total, item) => total + item.inwardQty, 0);
  const inMonthOutwardQty = transactions.reduce((total, item) => total + item.outwardQty, 0);
  const expectedOpeningQty = expectedClosingQty - inMonthInwardQty + inMonthOutwardQty;
  let openingQty = Math.round(expectedOpeningQty * 1000) / 1000;
  let openingRate = expectedClosingRate;
  let openingValue = openingQty * openingRate;
  if (openingQty < 0) {
    openingQty = 0;
    openingRate = 0;
    openingValue = 0;
  }

  const finalClosingQty = Math.round(expectedClosingQty * 1000) / 1000;
  const history = buildWeightedStockHistory({
    openingDate: monthStartDate,
    openingQty,
    openingValue,
    openingRowMode: "inward",
    transactions,
    finalClosing: { qty: finalClosingQty, value: expectedClosingValue },
  });

  return {
    stockItem,
    location,
    year,
    month,
    monthName: MONTH_NAMES[month - 1],
    openingBalance: { qty: openingQty, rate: openingRate, value: openingValue },
    transactions: history.transactions,
    totals: history.totals,
    _reconciliation: { voucherOpeningQty, voucherOpeningValue },
  };
}

function parseRouteInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0)
    throw Object.assign(new Error("Invalid route parameter"), { status: 400 });
  return parsed;
}

function sendError(res: any, error: any) {
  const status = Number(error?.status) || 500;
  return res.status(status).json({ message: error?.message || "Request failed" });
}

export function registerOptimizedStockHistoryRoutes(app: Express): void {
  app.get("/api/stock-items/:id/vouchers/:year/:month", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) return res.status(400).json({ message: "No company selected" });
      const stockItemId = parseRouteInteger(req.params.id);
      const year = parseRouteInteger(req.params.year);
      const month = parseRouteInteger(req.params.month);
      const key = `company:${companyId}:${stockItemId}:${year}:${month}`;
      return res.json(
        await coalesce(key, () => loadCompanyStockHistory(companyId, stockItemId, year, month)),
      );
    } catch (error: any) {
      return sendError(res, error);
    }
  });

  app.get(
    "/api/locations/:locationId/stock-items/:stockItemId/vouchers/:year/:month",
    requireAuth,
    async (req, res) => {
      try {
        const companyId = req.session.currentCompanyId;
        if (!companyId) return res.status(400).json({ message: "No company selected" });
        const locationId = parseRouteInteger(req.params.locationId);
        const stockItemId = parseRouteInteger(req.params.stockItemId);
        const year = parseRouteInteger(req.params.year);
        const month = parseRouteInteger(req.params.month);
        const key = `location:${companyId}:${locationId}:${stockItemId}:${year}:${month}`;
        const result = (await coalesce(key, () =>
          loadLocationStockHistory(companyId, locationId, stockItemId, year, month),
        )) as any;
        delete result._reconciliation;
        return res.json(result);
      } catch (error: any) {
        return sendError(res, error);
      }
    },
  );
}
