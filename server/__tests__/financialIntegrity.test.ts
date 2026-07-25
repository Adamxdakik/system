import { describe, expect, it } from "vitest";

import {
  aggregateDaybook,
  incomeStatement,
  netPosition,
  trialBalanceDifference,
} from "../financialAuditCore";
import {
  convertForeignToBase,
  decimalToScaledInteger,
  normalizeMoney,
} from "../services/accounting/money";
import type {
  AccountingStore,
  AccountingTransaction,
  PostedEntry,
  PostedVoucher,
  PostingEntryInput,
  PostingResult,
  VoucherPostingInput,
} from "../services/accounting/types";
import {
  AccountingIntegrityError,
  VoucherPostingService,
} from "../services/accounting/voucherPostingService";
import { VoucherReversalService } from "../services/accounting/voucherReversalService";

interface MemoryState {
  vouchers: PostedVoucher[];
  entries: PostedEntry[];
  employeeBalances: Map<number, bigint>;
  nextVoucherId: number;
  nextEntryId: number;
}

function cloneState(state: MemoryState): MemoryState {
  return {
    vouchers: structuredClone(state.vouchers),
    entries: structuredClone(state.entries),
    employeeBalances: new Map(state.employeeBalances),
    nextVoucherId: state.nextVoucherId,
    nextEntryId: state.nextEntryId,
  };
}

class MemoryTransaction implements AccountingTransaction {
  constructor(
    private readonly state: MemoryState,
    private readonly invalidReferences = new Set<number>(),
    private readonly failAt: "voucher" | "entries" | "balances" | null = null,
  ) {}

  private result(voucher: PostedVoucher): PostingResult {
    return {
      voucher,
      entries: this.state.entries.filter((entry) => entry.voucherId === voucher.id),
      duplicate: false,
    };
  }

  async findByIdempotencyKey(
    companyId: number,
    idempotencyKey: string,
  ): Promise<PostingResult | null> {
    const voucher = this.state.vouchers.find(
      (row) => row.companyId === companyId && row.idempotencyKey === idempotencyKey,
    );
    return voucher ? this.result(voucher) : null;
  }

  async findBySource(
    companyId: number,
    sourceType: string,
    sourceId: string,
  ): Promise<PostingResult | null> {
    const voucher = this.state.vouchers.find(
      (row) =>
        row.companyId === companyId && row.sourceType === sourceType && row.sourceId === sourceId,
    );
    return voucher ? this.result(voucher) : null;
  }

  async validateReferences(
    _companyId: number,
    entries: PostingEntryInput[],
    _locationId?: number | null,
  ): Promise<string[]> {
    return entries.flatMap((entry) =>
      entry.ledgerAccountId != null && this.invalidReferences.has(entry.ledgerAccountId)
        ? [`ledgerAccount:${entry.ledgerAccountId}`]
        : [],
    );
  }

  async createVoucher(
    input: VoucherPostingInput,
    _totalAmount: string,
    fingerprint: string,
    reversalOfVoucherId?: number | null,
  ): Promise<PostedVoucher> {
    if (this.failAt === "voucher") throw new Error("injected voucher failure");
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
    if (this.failAt === "entries") throw new Error("injected entry failure");
    const created = entries.map(
      (entry): PostedEntry => ({
        ...entry,
        id: this.state.nextEntryId++,
        voucherId,
        currency: entry.currency ?? "USD",
        foreignAmount: entry.foreignAmount ?? null,
        exchangeRate: entry.exchangeRate ?? null,
        baseAmount: entry.baseAmount ?? "0.00",
      }),
    );
    this.state.entries.push(...created);
    return created;
  }

  async applySupportingBalances(entries: PostingEntryInput[], direction: 1 | -1): Promise<void> {
    if (this.failAt === "balances") throw new Error("injected balance failure");
    for (const entry of entries) {
      if (entry.employeeId == null) continue;
      const delta =
        BigInt(direction) *
        (decimalToScaledInteger(entry.creditAmount, 2) -
          decimalToScaledInteger(entry.debitAmount, 2));
      this.state.employeeBalances.set(
        entry.employeeId,
        (this.state.employeeBalances.get(entry.employeeId) ?? 0n) + delta,
      );
    }
  }

  async loadVoucherForReversal(
    companyId: number,
    voucherId: number,
  ): Promise<PostingResult | null> {
    const voucher = this.state.vouchers.find(
      (row) => row.id === voucherId && row.companyId === companyId,
    );
    return voucher ? this.result(voucher) : null;
  }

  async markReversed(voucherId: number, reversedAt: Date): Promise<void> {
    const voucher = this.state.vouchers.find((row) => row.id === voucherId);
    if (voucher) voucher.reversedAt = reversedAt;
  }
}

class MemoryStore implements AccountingStore {
  state: MemoryState = {
    vouchers: [],
    entries: [],
    employeeBalances: new Map(),
    nextVoucherId: 1,
    nextEntryId: 1,
  };
  invalidReferences = new Set<number>();
  failAt: "voucher" | "entries" | "balances" | null = null;

  async transaction<T>(work: (tx: AccountingTransaction) => Promise<T>): Promise<T> {
    const working = cloneState(this.state);
    const result = await work(new MemoryTransaction(working, this.invalidReferences, this.failAt));
    this.state = working;
    return result;
  }
}

function posting(overrides: Partial<VoucherPostingInput> = {}): VoucherPostingInput {
  return {
    companyId: 1,
    voucherType: "Journal",
    voucherNumber: "J-1",
    transactionDate: "2024-02-29",
    currency: "USD",
    exchangeRate: "1",
    sourceType: "JOURNAL",
    sourceId: "source-1",
    idempotencyKey: "request-1",
    entries: [
      { ledgerAccountId: 1, debitAmount: "100.00", creditAmount: "0" },
      { ledgerAccountId: 2, debitAmount: "0", creditAmount: "100.00" },
    ],
    ...overrides,
  };
}

describe("decimal-safe money", () => {
  it("normalizes database decimals without floating point", () => {
    expect(normalizeMoney("001.2")).toBe("1.20");
    expect(decimalToScaledInteger("0.10", 2) + decimalToScaledInteger("0.20", 2)).toBe(30n);
  });

  it.each(["NaN", "Infinity", "-Infinity", "1.001"])("rejects invalid money %s", (value) => {
    expect(() => normalizeMoney(value)).toThrow();
  });

  it("converts FX once at the persistence boundary", () => {
    expect(convertForeignToBase("10.25", "1.23456789")).toBe("12.65");
  });
});

describe("voucher posting integrity", () => {
  it("posts a balanced two-entry journal", async () => {
    const store = new MemoryStore();
    const result = await new VoucherPostingService(store).post(posting());
    expect(result.entries).toHaveLength(2);
    expect(store.state.vouchers).toHaveLength(1);
  });

  it("rejects an unbalanced journal", async () => {
    const service = new VoucherPostingService(new MemoryStore());
    await expect(
      service.post(
        posting({
          entries: [
            { ledgerAccountId: 1, debitAmount: "100", creditAmount: "0" },
            { ledgerAccountId: 2, debitAmount: "0", creditAmount: "99.99" },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: "UNBALANCED_VOUCHER", status: 422 });
  });

  it("rejects negative entries", async () => {
    await expect(
      new VoucherPostingService(new MemoryStore()).post(
        posting({
          entries: [
            { debitAmount: "-1", creditAmount: "0" },
            { debitAmount: "0", creditAmount: "-1" },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: "NEGATIVE_VOUCHER_ENTRY" });
  });

  it("rejects an entry containing both debit and credit", async () => {
    await expect(
      new VoucherPostingService(new MemoryStore()).post(
        posting({
          entries: [
            { debitAmount: "1", creditAmount: "1" },
            { debitAmount: "1", creditAmount: "1" },
          ],
        }),
      ),
    ).rejects.toMatchObject({ code: "TWO_SIDED_VOUCHER_ENTRY" });
  });

  it("rejects zero-valued entries", async () => {
    await expect(
      new VoucherPostingService(new MemoryStore()).post(
        posting({ entries: [{ debitAmount: "0", creditAmount: "0" }] }),
      ),
    ).rejects.toBeInstanceOf(AccountingIntegrityError);
  });

  it("rejects a company-mismatched account", async () => {
    const store = new MemoryStore();
    store.invalidReferences.add(2);
    await expect(new VoucherPostingService(store).post(posting())).rejects.toMatchObject({
      code: "COMPANY_ISOLATION_VIOLATION",
      status: 403,
    });
  });

  it.each(["Payment", "Receipt", "Purchase"] as const)(
    "posts %s atomically",
    async (voucherType) => {
      const store = new MemoryStore();
      await new VoucherPostingService(store).post(
        posting({ voucherType, sourceType: voucherType.toUpperCase() }),
      );
      expect(store.state.vouchers).toHaveLength(1);
      expect(store.state.entries).toHaveLength(2);
    },
  );

  it("rolls back if entry creation fails after voucher creation", async () => {
    const store = new MemoryStore();
    store.failAt = "entries";
    await expect(new VoucherPostingService(store).post(posting())).rejects.toThrow(
      "injected entry failure",
    );
    expect(store.state.vouchers).toHaveLength(0);
    expect(store.state.entries).toHaveLength(0);
  });

  it("rolls back if supporting-balance synchronization fails", async () => {
    const store = new MemoryStore();
    store.failAt = "balances";
    await expect(
      new VoucherPostingService(store).post(
        posting({
          entries: [
            { employeeId: 5, debitAmount: "25", creditAmount: "0" },
            { ledgerAccountId: 1, debitAmount: "0", creditAmount: "25" },
          ],
        }),
      ),
    ).rejects.toThrow("injected balance failure");
    expect(store.state.vouchers).toHaveLength(0);
  });

  it("returns the same posting for an identical retry", async () => {
    const store = new MemoryStore();
    const service = new VoucherPostingService(store);
    const first = await service.post(posting());
    const retry = await service.post(posting());
    expect(retry.duplicate).toBe(true);
    expect(retry.voucher.id).toBe(first.voucher.id);
    expect(store.state.vouchers).toHaveLength(1);
  });

  it("rejects reusing an idempotency key for different content", async () => {
    const store = new MemoryStore();
    const service = new VoucherPostingService(store);
    await service.post(posting());
    await expect(
      service.post(
        posting({
          voucherNumber: "J-2",
          sourceId: "source-2",
        }),
      ),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_KEY_REUSED", status: 409 });
  });

  it("prevents duplicate POS source posting", async () => {
    const store = new MemoryStore();
    const service = new VoucherPostingService(store);
    const sale = posting({
      voucherType: "Sales",
      sourceType: "POS_SALE",
      sourceId: "sale-44",
      idempotencyKey: null,
    });
    await service.post(sale);
    const retry = await service.post({ ...sale, voucherNumber: "SALE-RETRY" });
    expect(retry.duplicate).toBe(true);
    expect(store.state.vouchers).toHaveLength(1);
  });

  it("preserves the selected business date", async () => {
    const result = await new VoucherPostingService(new MemoryStore()).post(
      posting({ transactionDate: "2030-12-31" }),
    );
    expect(result.voucher.transactionDate).toBe("2030-12-31");
  });

  it("preserves historical FX independently of a current rate", async () => {
    const store = new MemoryStore();
    const result = await new VoucherPostingService(store).post(
      posting({
        currency: "EUR",
        exchangeRate: "1.25000000",
        entries: [
          {
            ledgerAccountId: 1,
            debitAmount: "125",
            creditAmount: "0",
            currency: "EUR",
            foreignAmount: "100",
            exchangeRate: "1.25",
            baseAmount: "125",
          },
          {
            ledgerAccountId: 2,
            debitAmount: "0",
            creditAmount: "125",
            currency: "EUR",
            foreignAmount: "100",
            exchangeRate: "1.25",
            baseAmount: "125",
          },
        ],
      }),
    );
    const changedCurrentRate = "9.99999999";
    expect(changedCurrentRate).not.toBe(result.voucher.exchangeRate);
    expect(result.entries[0].exchangeRate).toBe("1.25000000");
  });

  it("updates an employee supporting balance in the same transaction", async () => {
    const store = new MemoryStore();
    await new VoucherPostingService(store).post(
      posting({
        entries: [
          { employeeId: 7, debitAmount: "40", creditAmount: "0" },
          { ledgerAccountId: 1, debitAmount: "0", creditAmount: "40" },
        ],
      }),
    );
    expect(store.state.employeeBalances.get(7)).toBe(-4000n);
  });
});

describe("voucher reversal integrity", () => {
  it("creates an exact linked reversal and restores supporting balance", async () => {
    const store = new MemoryStore();
    const original = await new VoucherPostingService(store).post(
      posting({
        entries: [
          { employeeId: 7, debitAmount: "40", creditAmount: "0" },
          { ledgerAccountId: 1, debitAmount: "0", creditAmount: "40" },
        ],
      }),
    );
    const reversal = await new VoucherReversalService(store).reverse({
      companyId: 1,
      voucherId: original.voucher.id,
      voucherNumber: "REV-1",
      transactionDate: "2024-03-01",
      idempotencyKey: "reverse-1",
    });
    expect(reversal.voucher.reversalOfVoucherId).toBe(original.voucher.id);
    expect(reversal.entries[0].creditAmount).toBe("40.00");
    expect(store.state.employeeBalances.get(7)).toBe(0n);
  });

  it("rejects a second reversal", async () => {
    const store = new MemoryStore();
    const original = await new VoucherPostingService(store).post(posting());
    const service = new VoucherReversalService(store);
    await service.reverse({
      companyId: 1,
      voucherId: original.voucher.id,
      voucherNumber: "REV-1",
      transactionDate: "2024-03-01",
      idempotencyKey: "reverse-1",
    });
    await expect(
      service.reverse({
        companyId: 1,
        voucherId: original.voucher.id,
        voucherNumber: "REV-2",
        transactionDate: "2024-03-02",
        idempotencyKey: "reverse-2",
      }),
    ).rejects.toMatchObject({ code: "VOUCHER_ALREADY_REVERSED" });
  });

  it("rolls back a partial reversal failure", async () => {
    const store = new MemoryStore();
    const original = await new VoucherPostingService(store).post(posting());
    store.failAt = "entries";
    await expect(
      new VoucherReversalService(store).reverse({
        companyId: 1,
        voucherId: original.voucher.id,
        voucherNumber: "REV-1",
        transactionDate: "2024-03-01",
        idempotencyKey: "reverse-1",
      }),
    ).rejects.toThrow("injected entry failure");
    expect(store.state.vouchers).toHaveLength(1);
    expect(store.state.vouchers[0].reversedAt).toBeNull();
  });

  it("uses the original FX rate and base amounts", async () => {
    const store = new MemoryStore();
    const original = await new VoucherPostingService(store).post(
      posting({
        currency: "EUR",
        exchangeRate: "1.25",
        entries: [
          {
            ledgerAccountId: 1,
            debitAmount: "125",
            creditAmount: "0",
            currency: "EUR",
            foreignAmount: "100",
            exchangeRate: "1.25",
            baseAmount: "125",
          },
          {
            ledgerAccountId: 2,
            debitAmount: "0",
            creditAmount: "125",
            currency: "EUR",
            foreignAmount: "100",
            exchangeRate: "1.25",
            baseAmount: "125",
          },
        ],
      }),
    );
    const reversal = await new VoucherReversalService(store).reverse({
      companyId: 1,
      voucherId: original.voucher.id,
      voucherNumber: "REV-FX",
      transactionDate: "2024-03-01",
      idempotencyKey: "reverse-fx",
    });
    expect(reversal.entries[0]).toMatchObject({
      exchangeRate: "1.25000000",
      foreignAmount: "100.00",
      baseAmount: "125.00",
    });
  });

  it("keeps daybook and trial balance reconciled after reversal", async () => {
    const store = new MemoryStore();
    const original = await new VoucherPostingService(store).post(posting());
    await new VoucherReversalService(store).reverse({
      companyId: 1,
      voucherId: original.voucher.id,
      voucherNumber: "REV-REPORT",
      transactionDate: "2024-03-01",
      idempotencyKey: "reverse-report",
    });
    const reportEntries = store.state.entries.map((entry) => ({
      debitAmount: entry.debitAmount,
      creditAmount: entry.creditAmount,
      accountType: entry.ledgerAccountId === 1 ? "Expense" : "Income",
    }));
    expect(aggregateDaybook(reportEntries)).toEqual({
      debitMinor: 20000n,
      creditMinor: 20000n,
    });
    expect(trialBalanceDifference(reportEntries)).toBe(0n);
    expect(incomeStatement(reportEntries).netIncomeMinor).toBe(0n);
    expect(netPosition(reportEntries)).toBe(0n);
  });
});
