export type MoneyInput = string | number | null | undefined;

export interface AuditEntry {
  id?: number;
  voucherId?: number;
  companyId?: number;
  accountCompanyId?: number | null;
  debitAmount: MoneyInput;
  creditAmount: MoneyInput;
}

export interface VoucherAuditResult {
  balanced: boolean;
  debitMinor: bigint;
  creditMinor: bigint;
  issues: string[];
}

export interface ReportEntry extends AuditEntry {
  voucherDate?: string;
  accountType?: string;
}

const MONEY_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/;

export function toMinorUnits(value: MoneyInput, scale = 2): bigint {
  const normalized = String(value ?? "0").trim();
  const match = normalized.match(MONEY_PATTERN);
  if (!match) {
    throw new Error(`Invalid decimal amount: ${normalized}`);
  }

  const [, sign, whole, fraction = ""] = match;
  if (fraction.length > scale) {
    const discarded = fraction.slice(scale);
    if (!/^0*$/.test(discarded)) {
      throw new Error(`Amount has more than ${scale} decimal places: ${normalized}`);
    }
  }

  const paddedFraction = fraction.slice(0, scale).padEnd(scale, "0");
  const factor = 10n ** BigInt(scale);
  const result = BigInt(whole) * factor + BigInt(paddedFraction || "0");
  return sign === "-" ? -result : result;
}

export function fromMinorUnits(value: bigint, scale = 2): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const factor = 10n ** BigInt(scale);
  const whole = absolute / factor;
  const fraction = (absolute % factor).toString().padStart(scale, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export function auditVoucherEntries(entries: AuditEntry[]): VoucherAuditResult {
  let debitMinor = 0n;
  let creditMinor = 0n;
  const issues: string[] = [];
  let debitEntryCount = 0;
  let creditEntryCount = 0;
  let meaningfulEntryCount = 0;

  entries.forEach((entry, index) => {
    const debit = toMinorUnits(entry.debitAmount);
    const credit = toMinorUnits(entry.creditAmount);
    debitMinor += debit;
    creditMinor += credit;

    if (debit < 0n || credit < 0n) issues.push(`entry[${index}]:negative-amount`);
    if (debit > 0n && credit > 0n) issues.push(`entry[${index}]:both-debit-and-credit`);
    if (debit === 0n && credit === 0n) issues.push(`entry[${index}]:zero-value`);
    if (debit > 0n) debitEntryCount += 1;
    if (credit > 0n) creditEntryCount += 1;
    if (debit !== 0n || credit !== 0n) meaningfulEntryCount += 1;
  });

  if (meaningfulEntryCount < 2) issues.push("fewer-than-two-meaningful-entries");
  if (debitEntryCount === 0) issues.push("missing-debit");
  if (creditEntryCount === 0) issues.push("missing-credit");
  if (debitMinor !== creditMinor) issues.push("unbalanced");

  return {
    balanced: debitMinor === creditMinor,
    debitMinor,
    creditMinor,
    issues,
  };
}

export function companyIsolationIssues(voucherCompanyId: number, entries: AuditEntry[]): string[] {
  return entries.flatMap((entry, index) => {
    if (entry.accountCompanyId == null) return [];
    return entry.accountCompanyId === voucherCompanyId
      ? []
      : [`entry[${index}]:account-company-${entry.accountCompanyId}`];
  });
}

export function aggregateDaybook(entries: ReportEntry[]): {
  debitMinor: bigint;
  creditMinor: bigint;
} {
  return entries.reduce(
    (total, entry) => ({
      debitMinor: total.debitMinor + toMinorUnits(entry.debitAmount),
      creditMinor: total.creditMinor + toMinorUnits(entry.creditAmount),
    }),
    { debitMinor: 0n, creditMinor: 0n },
  );
}

export function trialBalanceDifference(entries: ReportEntry[]): bigint {
  const totals = aggregateDaybook(entries);
  return totals.debitMinor - totals.creditMinor;
}

const INCOME_TYPES = new Set(["Income", "Direct Income", "Indirect Income"]);
const EXPENSE_TYPES = new Set([
  "Expense",
  "Direct Expense",
  "Indirect Expense",
  "Government Taxes",
]);

export function incomeStatement(entries: ReportEntry[]): {
  incomeMinor: bigint;
  expenseMinor: bigint;
  netIncomeMinor: bigint;
} {
  let incomeMinor = 0n;
  let expenseMinor = 0n;
  for (const entry of entries) {
    const debit = toMinorUnits(entry.debitAmount);
    const credit = toMinorUnits(entry.creditAmount);
    if (INCOME_TYPES.has(entry.accountType ?? "")) incomeMinor += credit - debit;
    if (EXPENSE_TYPES.has(entry.accountType ?? "")) expenseMinor += debit - credit;
  }
  return { incomeMinor, expenseMinor, netIncomeMinor: incomeMinor - expenseMinor };
}

export function netPosition(entries: ReportEntry[]): bigint {
  return entries.reduce((total, entry) => {
    const debit = toMinorUnits(entry.debitAmount);
    const credit = toMinorUnits(entry.creditAmount);
    return total + debit - credit;
  }, 0n);
}

export function duplicateSourceReferences(
  rows: Array<{ companyId: number; sourceType: string; sourceReference: string }>,
): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const row of rows) {
    const key = `${row.companyId}:${row.sourceType}:${row.sourceReference}`;
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  }
  return [...duplicates].sort();
}
