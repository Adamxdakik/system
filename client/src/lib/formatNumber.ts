export type CurrencyCode = "USD" | "CFA";

export function formatNumber(num: number, maxDecimals: number = 2): string {
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  });
}

export function formatCurrency(num: number): string {
  return formatNumber(num, 2);
}

export function formatCurrencyWithLabel(num: number | string, currency: CurrencyCode = "USD"): string {
  const numValue = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(numValue)) return "";

  if (currency === "USD") {
    const isWhole = Math.abs(numValue) % 1 === 0;
    return `$ ${numValue.toLocaleString(undefined, { minimumFractionDigits: isWhole ? 0 : 2, maximumFractionDigits: 2 })}`;
  } else {
    return `CFA ${numValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
}

export function formatPercent(num: number): string {
  return `${formatNumber(num, 2)}%`;
}
