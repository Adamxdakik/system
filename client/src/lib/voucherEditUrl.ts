/**
 * Returns the correct edit URL for any voucher type so every view in the app
 * routes to the same native editor — not the generic VoucherEdit fallback.
 *
 * @param voucherId   Numeric voucher ID
 * @param voucherType The voucher's type string (case-insensitive)
 * @param opts.prefix Optional route prefix, e.g. "/factory"
 */
export function getVoucherEditUrl(
  voucherId: number | string,
  voucherType: string,
  opts: { prefix?: string } = {},
): string {
  const prefix = opts.prefix ?? "";
  const type = (voucherType ?? "").toLowerCase();

  // Sales / POS → native POS editor
  if (type === "sales" || type === "pos") {
    return `/pos/edit/${voucherId}`;
  }

  // Payment / Receipt / Journal / Credit Note / Debit Note → Vouchers page tab
  const tabMap: Record<string, string> = {
    payment: "payment",
    receipt: "receipt",
    journal: "journal",
    "credit note": "credit-note",
    "debit note": "credit-note",
    contra: "journal",
  };
  const tab = tabMap[type];
  if (tab) {
    return `${prefix}/vouchers?edit=${voucherId}&tab=${tab}`;
  }

  // Stock Transfer → Vouchers page transfer tab
  if (type === "stocktransfer" || type === "stock transfer" || type === "transfer") {
    return `${prefix}/vouchers?edit=${voucherId}&tab=transfer`;
  }

  // Production / Consumption / Mixed → Vouchers page adjustment tab
  if (type === "production" || type === "consumption" || type === "mixed") {
    return `${prefix}/vouchers?edit=${voucherId}&tab=adjustment`;
  }

  // Fallback — VoucherEdit generic page
  return `${prefix}/vouchers/${voucherId}/edit`;
}
