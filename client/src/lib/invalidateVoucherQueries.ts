import type { QueryClient } from "@tanstack/react-query";

/**
 * Invalidate all accounting/ledger-related queries so Daybook, account
 * balances, ledger views, and VoucherDetail refresh after any voucher change.
 */
export function invalidateAccountingQueries(queryClient: QueryClient, voucherId?: number | string) {
  queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
  if (voucherId != null) {
    queryClient.invalidateQueries({ queryKey: [`/api/vouchers/${voucherId}`] });
  }
  queryClient.invalidateQueries({ queryKey: ["/api/voucher-detail"] });
  queryClient.invalidateQueries({ queryKey: ["/api/daybook"] });
  queryClient.invalidateQueries({ queryKey: ["/api/accounts/all"] });
  // Catch all /api/accounts/* sub-paths (balances, sidebar, etc.)
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey[0];
      return typeof key === "string" && key.startsWith("/api/accounts/");
    },
  });
  queryClient.invalidateQueries({ queryKey: ["/api/ledger-accounts"] });
  queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
  queryClient.invalidateQueries({ queryKey: ["/api/purchase-orders"] });
}

/**
 * Invalidate all inventory/stock-related queries so LocationInventory,
 * stock-item history, location summaries, and POS stock levels refresh
 * after any mutation that moves or adjusts stock.
 */
export function invalidateInventoryQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
  queryClient.invalidateQueries({ queryKey: ["/api/inventory-by-location"] });
  // Catch /api/locations/:id/inventory and similar
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey[0];
      return (
        typeof key === "string" &&
        (key.startsWith("/api/locations/") || key.includes("/inventory"))
      );
    },
  });
  queryClient.invalidateQueries({ queryKey: ["/api/stock-transfers"] });
  queryClient.invalidateQueries({ queryKey: ["/api/location-summary"] });
  queryClient.invalidateQueries({ queryKey: ["/api/stock-adjustments"] });
  queryClient.invalidateQueries({ queryKey: ["/api/pos/stock-items"] });
  // Monthly/period summaries used in StockItemHistory and LocationMonthlySummary
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey[0];
      return typeof key === "string" && key.includes("monthly-summary");
    },
  });
}

/**
 * Convenience: invalidate BOTH accounting and inventory queries.
 * Use for voucher types that touch both ledger entries and stock levels
 * (stock transfers, adjustments, production/consumption, offloads).
 */
export function invalidateTransferQueries(queryClient: QueryClient, voucherId?: number | string) {
  invalidateAccountingQueries(queryClient, voucherId);
  invalidateInventoryQueries(queryClient);
}
