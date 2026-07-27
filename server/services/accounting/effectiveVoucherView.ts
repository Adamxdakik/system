import { isNull, type SQL } from "drizzle-orm";

import { vouchers } from "@shared/schema";

export interface VoucherLifecycleState {
  deletedAt: Date | string | null;
  reversedAt: Date | string | null;
  reversalOfVoucherId: number | null;
}

/**
 * Normal operational views show only the currently-effective voucher.
 * Historical originals and their linked reversals remain in the database for audit.
 */
export function isEffectiveVoucherState(voucher: VoucherLifecycleState): boolean {
  return (
    voucher.deletedAt == null && voucher.reversedAt == null && voucher.reversalOfVoucherId == null
  );
}

/** Shared SQL lifecycle conditions for daybook and account-activity reads. */
export function effectiveVoucherConditions(): SQL[] {
  return [
    isNull(vouchers.deletedAt),
    isNull(vouchers.reversedAt),
    isNull(vouchers.reversalOfVoucherId),
  ];
}
