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
import { VoucherPostingService } from "../services/accounting/voucherPostingService";

interface MemoryState {
  voucher: PostedVoucher | null;
  entries: PostedEntry[];
}

function input(overrides: Partial<VoucherPostingInput> = {}): VoucherPostingInput {
  return {
    companyId: 1,
    voucherType: "Sales",
    voucherNumber: "SALE-1",
    transactionDate: "2026-07-25",
    currency: "USD",
    exchangeRate: "1",
    sourceType: "POS_SALE",
    sourceId: "sale-1",
    idempotencyKey: null,
    entries: [
      { ledgerAccountId: 1, debitAmount: "100.00", creditAmount: "0" },
      { ledgerAccountId: 2, debitAmount: "0", creditAmount: "100.00" },
    ],
    ...overrides,
  };
}

class MemoryTransaction implements AccountingTransaction {
  constructor(
    private readonly state: MemoryState,
    private readonly failUniqueOnCreate = false,
  ) {}

  private result(): PostingResult | null {
    if (!this.state.voucher) return null;
    return { voucher: this.state.voucher, entries: this.state.entries, duplicate: false };
  }

  async findByIdempotencyKey(companyId: number, idempotencyKey: string) {
    const result = this.result();
    return result?.voucher.companyId === companyId &&
      result.voucher.idempotencyKey === idempotencyKey
      ? result
      : null;
  }

  async findBySource(companyId: number, sourceType: string, sourceId: string) {
    const result = this.result();
    return result?.voucher.companyId === companyId &&
      result.voucher.sourceType === sourceType &&
      result.voucher.sourceId === sourceId
      ? result
      : null;
  }

  async validateReferences() {
    return [];
  }

  async createVoucher(
    posting: VoucherPostingInput,
    _totalAmount: string,
    fingerprint: string,
    reversalOfVoucherId?: number | null,
  ): Promise<PostedVoucher> {
    if (this.failUniqueOnCreate) {
      throw Object.assign(new Error("duplicate key"), { code: "23505" });
    }
    const voucher: PostedVoucher = {
      id: 1,
      companyId: posting.companyId,
      voucherNumber: posting.voucherNumber,
      voucherType: posting.voucherType,
      transactionDate: posting.transactionDate,
      currency: posting.currency ?? "USD",
      exchangeRate: posting.exchangeRate ?? "1.00000000",
      sourceType: posting.sourceType ?? null,
      sourceId: posting.sourceId ?? null,
      idempotencyKey: posting.idempotencyKey ?? null,
      idempotencyFingerprint: fingerprint,
      optional: posting.optional ?? false,
      reversalOfVoucherId: reversalOfVoucherId ?? null,
      reversedAt: null,
    };
    this.state.voucher = voucher;
    return voucher;
  }

  async createEntries(voucherId: number, entries: PostingEntryInput[]): Promise<PostedEntry[]> {
    this.state.entries = entries.map((entry, index) => ({
      ...entry,
      id: index + 1,
      voucherId,
      currency: entry.currency ?? "USD",
      foreignAmount: entry.foreignAmount ?? null,
      exchangeRate: entry.exchangeRate ?? null,
      baseAmount: entry.baseAmount ?? "0.00",
    }));
    return this.state.entries;
  }

  async applySupportingBalances() {}

  async loadVoucherForReversal() {
    return this.result();
  }

  async markReversed() {}
}

class MemoryStore implements AccountingStore {
  readonly state: MemoryState = { voucher: null, entries: [] };

  transaction<T>(work: (tx: AccountingTransaction) => Promise<T>): Promise<T> {
    return work(new MemoryTransaction(this.state));
  }
}

class UniqueRaceStore implements AccountingStore {
  private calls = 0;

  constructor(private readonly state: MemoryState) {}

  transaction<T>(work: (tx: AccountingTransaction) => Promise<T>): Promise<T> {
    this.calls += 1;
    return work(new MemoryTransaction(this.state, this.calls === 1));
  }
}

describe("accounting source idempotency", () => {
  it("returns an identical source retry as the existing posting", async () => {
    const store = new MemoryStore();
    const service = new VoucherPostingService(store);
    const first = await service.post(input());
    const retry = await service.post(input());

    expect(retry.duplicate).toBe(true);
    expect(retry.voucher.id).toBe(first.voucher.id);
  });

  it("rejects a changed request that reuses the same source reference", async () => {
    const store = new MemoryStore();
    const service = new VoucherPostingService(store);
    await service.post(input());

    await expect(
      service.post(
        input({
          voucherNumber: "SALE-CHANGED",
          entries: [
            { ledgerAccountId: 1, debitAmount: "125.00", creditAmount: "0" },
            { ledgerAccountId: 2, debitAmount: "0", creditAmount: "125.00" },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: "SOURCE_REFERENCE_REUSED", status: 409 });
  });

  it("resolves a concurrent unique-key race to the matching existing posting", async () => {
    const seededStore = new MemoryStore();
    await new VoucherPostingService(seededStore).post(input());

    const result = await new VoucherPostingService(new UniqueRaceStore(seededStore.state)).post(
      input(),
    );
    expect(result.duplicate).toBe(true);
    expect(result.voucher.id).toBe(1);
  });

  it("keeps a concurrent source collision as a conflict when content differs", async () => {
    const seededStore = new MemoryStore();
    await new VoucherPostingService(seededStore).post(input());

    await expect(
      new VoucherPostingService(new UniqueRaceStore(seededStore.state)).post(
        input({
          voucherNumber: "SALE-CONFLICT",
          entries: [
            { ledgerAccountId: 1, debitAmount: "80.00", creditAmount: "0" },
            { ledgerAccountId: 2, debitAmount: "0", creditAmount: "80.00" },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: "SOURCE_REFERENCE_REUSED", status: 409 });
  });
});
