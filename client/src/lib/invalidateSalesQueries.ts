import type { QueryClient } from "@tanstack/react-query";

/**
 * Invalidate every query that displays sale data so all linked views
 * (POSDaybook, Sales History, Daybook, VoucherDetail, inventory, etc.)
 * refresh after any sale is created, edited, or deleted.
 *
 * @param queryClient  The shared React Query client
 * @param voucherId    Optional – when known, also invalidate the specific detail key
 */
export function invalidateSalesQueries(queryClient: QueryClient, voucherId?: number) {
  // Voucher list + detail (POSDaybook list, Daybook, stock-transfer, etc.)
  queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });

  // Specific voucher detail panel
  if (voucherId) {
    queryClient.invalidateQueries({ queryKey: [`/api/vouchers/${voucherId}`] });
  }

  // Sales History page (SalesReport.tsx) — uses /api/sales-report?... keys
  queryClient.invalidateQueries({ queryKey: ["/api/sales-report"] });

  // VoucherDetail page
  queryClient.invalidateQueries({ queryKey: ["/api/voucher-detail"] });

  // Account balances that reflect sales
  queryClient.invalidateQueries({ queryKey: ["/api/accounts/all"] });
  queryClient.invalidateQueries({ queryKey: ["/api/accounts/voucher-sidebar"] });
  queryClient.invalidateQueries({ queryKey: ["/api/ledger-accounts"] });

  // Inventory levels change when sale items are corrected
  queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
  queryClient.invalidateQueries({ queryKey: ["/api/pos/stock-items"] });
}
