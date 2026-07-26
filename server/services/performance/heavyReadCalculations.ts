export interface StockHistoryTransaction {
  date: string;
  particulars: string;
  vchType: string;
  voucherId: number;
  poId?: number;
  inwardQty: number;
  inwardRate: number;
  inwardValue: number;
  outwardQty: number;
  outwardRate: number;
  outwardValue: number;
  isOpeningBalance?: boolean;
  isPOS?: boolean;
  posSellingRate?: number;
  posSellingValue?: number;
}

export interface StockHistoryTransactionWithBalance extends StockHistoryTransaction {
  closingQty: number;
  closingRate: number;
  closingValue: number;
}

export interface StockHistoryTotals {
  inwardQty: number;
  inwardRate: number;
  inwardValue: number;
  outwardQty: number;
  outwardRate: number;
  outwardValue: number;
  closingQty: number;
  closingRate: number;
  closingValue: number;
}

export interface BuildStockHistoryInput {
  openingDate: string;
  openingQty: number;
  openingValue: number;
  openingRowMode: "closing-only" | "inward";
  transactions: StockHistoryTransaction[];
  finalClosing?: {
    qty: number;
    value: number;
  };
}

export function numericValue(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function calculateSignedAccountBalance(
  openingBalance: unknown,
  openingBalanceSide: string | null | undefined,
  debits: unknown,
  credits: unknown,
): { balance: number; balanceSide: "Dr" | "Cr" } {
  let signedBalance = numericValue(openingBalance);
  if (openingBalanceSide === "Cr") signedBalance = -signedBalance;
  signedBalance += numericValue(debits) - numericValue(credits);
  return {
    balance: Math.abs(signedBalance),
    balanceSide: signedBalance >= 0 ? "Dr" : "Cr",
  };
}

export function monthWindow(
  year: number,
  month: number,
): {
  monthStart: Date;
  nextMonthStart: Date;
  monthStartDate: string;
  nextMonthStartDate: string;
} {
  if (!Number.isInteger(year) || year < 1900 || year > 9999) {
    throw new Error("Invalid year");
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month");
  }

  const monthStart = new Date(year, month - 1, 1);
  const nextMonthStart = new Date(year, month, 1);
  return {
    monthStart,
    nextMonthStart,
    monthStartDate: monthStart.toISOString().split("T")[0],
    nextMonthStartDate: nextMonthStart.toISOString().split("T")[0],
  };
}

export function buildWeightedStockHistory({
  openingDate,
  openingQty,
  openingValue,
  openingRowMode,
  transactions,
  finalClosing,
}: BuildStockHistoryInput): {
  transactions: StockHistoryTransactionWithBalance[];
  totals: StockHistoryTotals;
} {
  let runningQty = openingQty;
  let runningValue = openingValue;
  const openingRate = runningQty > 0 ? runningValue / runningQty : 0;
  const rows: StockHistoryTransactionWithBalance[] = [];

  if (openingQty !== 0 || openingValue !== 0) {
    rows.push({
      date: openingDate,
      particulars: "Opening Balance",
      vchType: "",
      voucherId: 0,
      inwardQty: openingRowMode === "inward" ? openingQty : 0,
      inwardRate: openingRowMode === "inward" ? openingRate : 0,
      inwardValue: openingRowMode === "inward" ? openingValue : 0,
      outwardQty: 0,
      outwardRate: 0,
      outwardValue: 0,
      closingQty: openingQty,
      closingRate: openingRate,
      closingValue: openingValue,
      isOpeningBalance: true,
    });
  }

  for (const transaction of transactions) {
    const currentAverageRate = runningQty > 0 ? runningValue / runningQty : 0;
    runningQty += transaction.inwardQty - transaction.outwardQty;
    const actualOutwardCost = transaction.outwardQty * currentAverageRate;
    runningValue += transaction.inwardValue - actualOutwardCost;
    const closingRate = runningQty > 0 ? runningValue / runningQty : 0;

    rows.push({
      ...transaction,
      outwardRate: transaction.outwardQty !== 0 ? currentAverageRate : 0,
      outwardValue: transaction.outwardQty !== 0 ? actualOutwardCost : 0,
      closingQty: runningQty,
      closingRate,
      closingValue: runningValue,
    });
  }

  if (finalClosing) {
    runningQty = finalClosing.qty;
    runningValue = finalClosing.value;
    const lastRow = rows.at(-1);
    if (lastRow) {
      lastRow.closingQty = runningQty;
      lastRow.closingValue = runningValue;
      lastRow.closingRate = runningQty > 0 ? runningValue / runningQty : 0;
    }
  }

  const processedRows = rows.filter((row) => !row.isOpeningBalance);
  const inwardQty = processedRows.reduce((total, row) => total + row.inwardQty, 0);
  const inwardValue = processedRows.reduce((total, row) => total + row.inwardValue, 0);
  const outwardQty = processedRows.reduce((total, row) => total + row.outwardQty, 0);
  const outwardValue = processedRows.reduce((total, row) => total + row.outwardValue, 0);

  return {
    transactions: rows,
    totals: {
      inwardQty,
      inwardRate: inwardQty > 0 ? inwardValue / inwardQty : 0,
      inwardValue,
      outwardQty,
      outwardRate: outwardQty > 0 ? outwardValue / outwardQty : 0,
      outwardValue,
      closingQty: runningQty,
      closingRate: runningQty > 0 ? runningValue / runningQty : 0,
      closingValue: runningValue,
    },
  };
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
