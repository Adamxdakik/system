export interface FinalizedVoucherState {
  optional: boolean;
  reversedAt: Date | string | null;
}

export type FinalizedMutationDecision =
  | { allowed: true }
  | {
      allowed: false;
      code: "FINALIZED_VOUCHER_IMMUTABLE" | "VOUCHER_ALREADY_REVERSED";
      message: string;
    };

export function decideFinalizedVoucherMutation(
  voucher: FinalizedVoucherState,
): FinalizedMutationDecision {
  if (voucher.reversedAt) {
    return {
      allowed: false,
      code: "VOUCHER_ALREADY_REVERSED",
      message: "This voucher has already been reversed and cannot be changed.",
    };
  }

  if (!voucher.optional) {
    return {
      allowed: false,
      code: "FINALIZED_VOUCHER_IMMUTABLE",
      message:
        "Finalized vouchers are immutable. Reverse this voucher, then create the corrected replacement.",
    };
  }

  return { allowed: true };
}
