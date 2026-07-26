export type VoucherType =
  | "Payment"
  | "Receipt"
  | "Journal"
  | "Sales"
  | "Purchase"
  | "Contra"
  | "Stock Transfer";

export interface PostingEntryInput {
  ledgerAccountId?: number | null;
  bankAccountId?: number | null;
  fixedAssetId?: number | null;
  customerId?: number | null;
  supplierId?: number | null;
  employeeId?: number | null;
  debitAmount: string;
  creditAmount: string;
  description?: string | null;
  currency?: string;
  foreignAmount?: string | null;
  exchangeRate?: string | null;
  baseAmount?: string | null;
}

export interface VoucherPostingInput {
  companyId: number;
  locationId?: number | null;
  voucherType: VoucherType;
  voucherNumber: string;
  transactionDate: string;
  description?: string | null;
  currency?: string;
  exchangeRate?: string;
  sourceType?: string | null;
  sourceId?: string | null;
  idempotencyKey?: string | null;
  createdBy?: string | null;
  optional?: boolean;
  entries: PostingEntryInput[];
}

export interface PostedVoucher {
  id: number;
  companyId: number;
  voucherNumber: string;
  voucherType: string;
  transactionDate: string;
  currency: string;
  exchangeRate: string;
  sourceType: string | null;
  sourceId: string | null;
  idempotencyKey: string | null;
  idempotencyFingerprint: string | null;
  optional: boolean;
  reversalOfVoucherId: number | null;
  reversedAt: Date | null;
}

export interface PostedEntry extends PostingEntryInput {
  id: number;
  voucherId: number;
  currency: string;
  foreignAmount: string | null;
  exchangeRate: string | null;
  baseAmount: string;
}

export interface PostingResult {
  voucher: PostedVoucher;
  entries: PostedEntry[];
  duplicate: boolean;
}

export interface AccountingTransaction {
  findByIdempotencyKey(companyId: number, idempotencyKey: string): Promise<PostingResult | null>;
  findBySource(
    companyId: number,
    sourceType: string,
    sourceId: string,
  ): Promise<PostingResult | null>;
  validateReferences(
    companyId: number,
    entries: PostingEntryInput[],
    locationId?: number | null,
  ): Promise<string[]>;
  createVoucher(
    input: VoucherPostingInput,
    totalAmount: string,
    fingerprint: string,
    reversalOfVoucherId?: number | null,
  ): Promise<PostedVoucher>;
  createEntries(voucherId: number, entries: PostingEntryInput[]): Promise<PostedEntry[]>;
  applySupportingBalances(entries: PostingEntryInput[], direction: 1 | -1): Promise<void>;
  loadVoucherForReversal(companyId: number, voucherId: number): Promise<PostingResult | null>;
  markReversed(voucherId: number, reversedAt: Date): Promise<void>;
}

export interface AccountingStore {
  transaction<T>(work: (tx: AccountingTransaction) => Promise<T>): Promise<T>;
}
