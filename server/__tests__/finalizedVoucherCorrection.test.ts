import { describe, expect, it } from "vitest";

import type {
  AccountingStore,
  AccountingTransaction,
  PostedEntry,
  PostedVoucher,
  PostingEntryInput,
  PostingResult,
  VoucherPostingInput,
} from "../services/accounting/types";
import { decimalToScaledInteger } from "../services/accounting/money";
import { FinalizedVoucherCorrectionService } from "../services/accounting/finalizedVoucherCorrectionService";

interface State {
  vouchers: PostedVoucher[];
  entries: PostedEntry[];
  nextVoucherId: number;
  nextEntryId: number;
}

function cloneState(state: State): State {
  return {
    vouchers: structuredClone(state.vouchers),
    entries: structuredClone(state.entries),
    nextVoucherId: state.nextVoucherId,
    nextEntryId: state.nextEntryId,
  };
}

class MemoryTransaction implements AccountingTransaction {
  constructor(private readonly state: State) {}

  private result(voucher: PostedVoucher): PostingResult {
    return {
      voucher,
      entries: this.state.entries.filter((entry) => entry.voucherId === voucher.id),
      duplicate: false,
    };
  }

  async findByIdempotencyKey(companyId: number, idempotencyKey: string) {
    const voucher = this.state.vouchers.find(
      (row) => row.companyId === companyId && row.idempotencyKey === idempotencyKey,
    );
    return voucher ? this.result(voucher) : null;
  }

  async findBySource(companyId: number, sourceType: string, sourceId: string) {
    const voucher = this.state.vouchers.find(
      (row) =>
        row.companyId === companyId && row.sourceType === sourceType && row.sourceId === sourceId,
    );
    return voucher ? this.result(voucher) : null;
  }

  async validateReferences() {
    return [];
  }

  async createVoucher(
    input: VoucherPostingInput,
    _totalAmount: string,
    fingerprint: string,
    reversalOfVoucherId?: number | null,
  ): Promise<PostedVoucher> {
    const voucher: PostedVoucher = {
      id: this.state.nextVoucherId++,
      companyId: input.companyId,
      voucherNumber: input.voucherNumber,
      voucherType: input.voucherType,
      transactionDate: input.transactionDate,
      currency: input.currency ?? "USD",
      exchangeRate: input.exchangeRate ?? "1.00000000",
      sourceType: input.sourceType ?? null,
      sourceId: input.sourceId ?? null,
      idempotencyKey: input.idempotencyKey ?? null,
      idempotencyFingerprint: fingerprint,
      optional: input.optional ?? false,
      reversalOfVoucherId: reversalOfVoucherId ?? null,
      reversedAt: null,
    };
    this.state.vouchers.push(voucher);
    return voucher;
  }

  async createEntries(voucherId: number, entries: PostingEntryInput[]): Promise<PostedEntry[]> {
    const created = entries.map((entry) => ({
      ...entry,
      id: this.state.nextEntryId++,
      voucherId,
      currency: entry.currency ?? "USD",
      foreignAmount: entry.foreignAmount ?? null,
      exchangeRate: entry.exchangeRate ?? null,
      baseAmount: entry.baseAmount ?? "0.00",
    }));
    this.state.entries.push(...created);
    return created;
  }

  async applySupportingBalances() {}

  async loadVoucherForReversal(companyId: number, voucherId: number) {
    const voucher = this.state.vouchers.find(
      (row) => row.companyId === companyId && row.id === voucherId,
    );
    return voucher ? this.result(voucher) : null;
  }

  async markReversed(voucherId: number, reversedAt: Date) {
    const voucher = this.state.vouchers.find((row) => row.id === voucherId);
    if (voucher) voucher.reversedAt = reversedAt;
  }
}

class MemoryStore implements AccountingStore {
  state: State;

  constructor() {
    this.state = {
      vouchers: [
        {
          id: 1,
          companyId: 1,
          voucherNumber: "J-1",
          voucherType: "Journal",
          transactionDate: "2026-07-01",
          currency: "USD",
          exchangeRate: "1.00000000",
          sourceType: "JOURNAL",
          sourceId: "journal-1",
          idempotencyKey: "journal-1",
          idempotencyFingerprint: "original",
          optional: false,
          reversalOfVoucherId: null,
          reversedAt: null,
        },
      ],
      entries: [
        {
          id: 1,
          voucherId: 1,
          ledgerAccountId: 10,
          debitAmount: "100.00",
          creditAmount: "0.00",
          currency: "USD",
          foreignAmount: null,
          exchangeRate: "1.00000000",
          baseAmount: "100.00",
        },
        {
          id: 2,
          voucherId: 1,
          ledgerAccountId: 20,
          debitAmount: "0.00",
          creditAmount: "100.00",
          currency: "USD",
          foreignAmount: null,
          exchangeRate: "1.00000000",
          baseAmount: "100.00",
        },
      ],
      nextVoucherId: 2,
      nextEntryId: 3,
    };
  }

  async transaction<T>(work: (tx: AccountingTransaction) => Promise<T>): Promise<T> {
    const working = cloneState(this.state);
    const result = await work(new MemoryTransaction(working));
    this.state = working;
    return result;
  }
}

function correction(amount = "125.00") {
  return {
    companyId: 1,
    voucherId: 1,
    idempotencyKey: "correction-1",
    replacement: {
      voucherType: "Journal" as const,
      voucherNumber: "J-1-CORR",
      transactionDate: "2026-07-02",
      description: "Corrected journal",
      currency: "USD",
      exchangeRate: "1",
      entries: [
        { ledgerAccountId: 10, debitAmount: amount, creditAmount: "0" },
        { ledgerAccountId: 20, debitAmount: "0", creditAmount: amount },
      ],
    },
  };
}

describe("finalized voucher correction", () => {
  it("atomically reverses the original and posts a replacement", async () => {
    const store = new MemoryStore();
    const result = await new FinalizedVoucherCorrectionService(store).correct(correction());

    expect(result.duplicate).toBe(false);
    expect(store.state.vouchers).toHaveLength(3);
    expect(store.state.vouchers[0].reversedAt).toBeInstanceOf(Date);
    expect(result.reversal.voucher.reversalOfVoucherId).toBe(1);
    expect(result.replacement.voucher.sourceType).toBe("VOUCHER_REPLACEMENT");

    const reversalDebit = result.reversal.entries.reduce(
      (sum, entry) => sum + decimalToScaledInteger(entry.debitAmount, 2),
      0n,
    );
    expect(reversalDebit).toBe(10000n);
  });

  it("returns the same correction for an identical retry", async () => {
    const store = new MemoryStore();
    const service = new FinalizedVoucherCorrectionService(store);
    const first = await service.correct(correction());
    const retry = await service.correct(correction());

    expect(retry.duplicate).toBe(true);
    expect(retry.replacement.voucher.id).toBe(first.replacement.voucher.id);
    expect(store.state.vouchers).toHaveLength(3);
  });

  it("rejects changed content that reuses the correction key", async () => {
    const store = new MemoryStore();
    const service = new FinalizedVoucherCorrectionService(store);
    await service.correct(correction());

    await expect(service.correct(correction("130.00"))).rejects.toMatchObject({
      code: "IDEMPOTENCY_KEY_REUSED",
      status: 409,
    });
    expect(store.state.vouchers).toHaveLength(3);
  });

  it("rolls back reversal when replacement validation fails", async () => {
    const store = new MemoryStore();
    const service = new FinalizedVoucherCorrectionService(store);

    await expect(
      service.correct({
        ...correction(),
        replacement: {
          ...correction().replacement,
          entries: [
            { ledgerAccountId: 10, debitAmount: "100", creditAmount: "0" },
            { ledgerAccountId: 20, debitAmount: "0", creditAmount: "99" },
          ],
        },
      }),
    ).rejects.toMatchObject({ code: "UNBALANCED_VOUCHER" });

    expect(store.state.vouchers).toHaveLength(1);
    expect(store.state.vouchers[0].reversedAt).toBeNull();
  });
});
