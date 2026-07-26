export const motorcycleSaleEligibleStatuses = ["IN_STOCK", "RESERVED"] as const;

export interface FinalizedSalesVoucherState {
  voucherType: string;
  optional: boolean;
  deletedAt: Date | string | null;
  reversedAt: Date | string | null;
  reversalOfVoucherId: number | null;
}

export function isMotorcycleSaleEligible(status: string): boolean {
  return motorcycleSaleEligibleStatuses.includes(
    status as (typeof motorcycleSaleEligibleStatuses)[number],
  );
}

export function isActiveFinalizedSalesVoucher(voucher: FinalizedSalesVoucherState): boolean {
  return (
    voucher.voucherType === "Sales" &&
    voucher.optional === false &&
    voucher.deletedAt == null &&
    voucher.reversedAt == null &&
    voucher.reversalOfVoucherId == null
  );
}

export function motorcycleAndVoucherLocationsMatch(
  motorcycleLocationId: number | null,
  voucherLocationId: number | null,
): boolean {
  return (
    motorcycleLocationId == null ||
    voucherLocationId == null ||
    motorcycleLocationId === voucherLocationId
  );
}

export function motorcyclePriceFitsVoucher(
  motorcycleSellingPrice: string | number,
  voucherTotal: string | number,
): boolean {
  const sellingPrice = Number(motorcycleSellingPrice);
  const total = Number(voucherTotal);
  return (
    Number.isFinite(sellingPrice) &&
    Number.isFinite(total) &&
    sellingPrice > 0 &&
    total > 0 &&
    sellingPrice <= total
  );
}

export function warrantyDatesAreValid(
  warrantyStartDate: string | null | undefined,
  warrantyEndDate: string | null | undefined,
): boolean {
  return !warrantyStartDate || !warrantyEndDate || warrantyEndDate >= warrantyStartDate;
}

export function linkedSaleCanBeReleased(reversedAt: Date | string | null): boolean {
  return reversedAt != null;
}
