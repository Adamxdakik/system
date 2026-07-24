import { fileURLToPath } from "node:url";
import path from "node:path";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

export interface AuditOptions {
  companyId?: number;
  dateFrom?: string;
  dateTo?: string;
  sourceType?: string;
  limit: number;
  output: "json" | "console";
  confirmNonProduction: boolean;
}

interface AuditCheck {
  name: string;
  description: string;
  sql: string;
  usesVoucherFilters?: boolean;
}

interface AuditResult {
  check: string;
  description: string;
  count: number;
  rows: QueryResultRow[];
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function usage(): string {
  return [
    "Read-only financial integrity audit",
    "",
    "Usage:",
    "  npm run audit:financial -- --confirm-non-production [filters]",
    "",
    "Filters:",
    "  --company-id <id>",
    "  --date-from <YYYY-MM-DD>",
    "  --date-to <YYYY-MM-DD>",
    "  --source-type <voucher type>",
    "  --limit <1-10000>                default: 200",
    "  --output <console|json>           default: console",
    "",
    "Safety:",
    "  --confirm-non-production is mandatory. The script starts a READ ONLY",
    "  transaction and contains no repair or apply mode.",
  ].join("\n");
}

export function parseAuditArgs(argv: string[]): AuditOptions {
  const options: AuditOptions = {
    limit: 200,
    output: "console",
    confirmNonProduction: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === "--help" || argument === "-h") {
      console.log(usage());
      process.exit(0);
    } else if (argument === "--confirm-non-production") {
      options.confirmNonProduction = true;
    } else if (argument === "--company-id") {
      options.companyId = Number(value);
      index += 1;
    } else if (argument === "--date-from") {
      options.dateFrom = value;
      index += 1;
    } else if (argument === "--date-to") {
      options.dateTo = value;
      index += 1;
    } else if (argument === "--source-type") {
      options.sourceType = value;
      index += 1;
    } else if (argument === "--limit") {
      options.limit = Number(value);
      index += 1;
    } else if (argument === "--output") {
      options.output = value as AuditOptions["output"];
      index += 1;
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }

  if (
    options.companyId !== undefined &&
    (!Number.isInteger(options.companyId) || options.companyId < 1)
  ) {
    throw new Error("--company-id must be a positive integer");
  }
  if (options.dateFrom && !DATE_PATTERN.test(options.dateFrom)) {
    throw new Error("--date-from must use YYYY-MM-DD");
  }
  if (options.dateTo && !DATE_PATTERN.test(options.dateTo)) {
    throw new Error("--date-to must use YYYY-MM-DD");
  }
  if (!Number.isInteger(options.limit) || options.limit < 1 || options.limit > 10_000) {
    throw new Error("--limit must be an integer between 1 and 10000");
  }
  if (options.output !== "console" && options.output !== "json") {
    throw new Error("--output must be console or json");
  }
  if (!options.confirmNonProduction) {
    throw new Error(
      "Refusing to connect without --confirm-non-production. Never run this audit against production.",
    );
  }
  return options;
}

function connectionString(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  if (PGHOST && PGPORT && PGUSER && PGPASSWORD && PGDATABASE) {
    return `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
  }
  throw new Error("No database configuration found. Set DATABASE_URL or the PG* variables.");
}

function voucherFilter(options: AuditOptions): { clause: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    values.push(value);
    conditions.push(sql.replace("?", `$${values.length}`));
  };
  if (options.companyId !== undefined) add("v.company_id = ?", options.companyId);
  if (options.dateFrom) add("v.voucher_date >= ?::date", options.dateFrom);
  if (options.dateTo) add("v.voucher_date <= ?::date", options.dateTo);
  if (options.sourceType) add("lower(v.voucher_type) = lower(?)", options.sourceType);
  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

const CHECKS: AuditCheck[] = [
  {
    name: "unbalanced_vouchers",
    description: "Posted voucher debit and credit totals differ.",
    usesVoucherFilters: true,
    sql: `
      SELECT v.id, v.company_id, v.voucher_number, v.voucher_type, v.voucher_date,
             COALESCE(SUM(ve.debit_amount), 0)::text AS debits,
             COALESCE(SUM(ve.credit_amount), 0)::text AS credits,
             (COALESCE(SUM(ve.debit_amount), 0) - COALESCE(SUM(ve.credit_amount), 0))::text AS difference
      FROM filtered_vouchers v
      LEFT JOIN voucher_entries ve ON ve.voucher_id = v.id
      WHERE v.optional = false
      GROUP BY v.id, v.company_id, v.voucher_number, v.voucher_type, v.voucher_date
      HAVING COALESCE(SUM(ve.debit_amount), 0) <> COALESCE(SUM(ve.credit_amount), 0)
      ORDER BY ABS(COALESCE(SUM(ve.debit_amount), 0) - COALESCE(SUM(ve.credit_amount), 0)) DESC`,
  },
  {
    name: "fewer_than_two_entries",
    description: "Posted vouchers with fewer than two entries.",
    usesVoucherFilters: true,
    sql: `
      SELECT v.id, v.company_id, v.voucher_number, COUNT(ve.id)::int AS entry_count
      FROM filtered_vouchers v
      LEFT JOIN voucher_entries ve ON ve.voucher_id = v.id
      WHERE v.optional = false
      GROUP BY v.id, v.company_id, v.voucher_number
      HAVING COUNT(ve.id) < 2`,
  },
  {
    name: "zero_value_entries",
    description: "Voucher entries with zero debit and zero credit.",
    usesVoucherFilters: true,
    sql: `
      SELECT ve.id AS entry_id, v.id AS voucher_id, v.company_id, v.voucher_number
      FROM voucher_entries ve
      JOIN filtered_vouchers v ON v.id = ve.voucher_id
      WHERE COALESCE(ve.debit_amount, 0) = 0 AND COALESCE(ve.credit_amount, 0) = 0`,
  },
  {
    name: "both_debit_and_credit",
    description: "Voucher entries with both debit and credit greater than zero.",
    usesVoucherFilters: true,
    sql: `
      SELECT ve.id AS entry_id, v.id AS voucher_id, v.company_id, v.voucher_number,
             ve.debit_amount::text, ve.credit_amount::text
      FROM voucher_entries ve
      JOIN filtered_vouchers v ON v.id = ve.voucher_id
      WHERE ve.debit_amount > 0 AND ve.credit_amount > 0`,
  },
  {
    name: "orphan_voucher_entries",
    description: "Voucher entries whose voucher does not exist.",
    sql: `
      SELECT ve.id AS entry_id, ve.voucher_id
      FROM voucher_entries ve
      LEFT JOIN vouchers v ON v.id = ve.voucher_id
      WHERE v.id IS NULL`,
  },
  {
    name: "cross_company_accounts",
    description: "Voucher entries linked to a ledger, bank, or employee from another company.",
    usesVoucherFilters: true,
    sql: `
      SELECT ve.id AS entry_id, v.id AS voucher_id, v.company_id AS voucher_company_id,
             COALESCE(la.company_id, ba.company_id, e.company_id) AS account_company_id,
             ve.ledger_account_id, ve.bank_account_id, ve.employee_id
      FROM voucher_entries ve
      JOIN filtered_vouchers v ON v.id = ve.voucher_id
      LEFT JOIN ledger_accounts la ON la.id = ve.ledger_account_id
      LEFT JOIN bank_accounts ba ON ba.id = ve.bank_account_id
      LEFT JOIN employees e ON e.id = ve.employee_id
      WHERE (la.id IS NOT NULL AND la.company_id <> v.company_id)
         OR (ba.id IS NOT NULL AND ba.company_id <> v.company_id)
         OR (e.id IS NOT NULL AND e.company_id <> v.company_id)`,
  },
  {
    name: "customer_balance_mismatch",
    description:
      "Latest customer balance history differs from opening balance plus linked ledger movements.",
    sql: `
      WITH latest AS (
        SELECT DISTINCT ON (cb.company_id, cb.customer_id)
               cb.company_id, cb.customer_id, cb.balance
        FROM customer_balances cb
        ORDER BY cb.company_id, cb.customer_id, cb.created_at DESC, cb.id DESC
      ), ledger AS (
        SELECT c.company_id, c.id AS customer_id,
               COALESCE(c.opening_balance, 0) +
               COALESCE(SUM(ve.debit_amount - ve.credit_amount) FILTER (WHERE v.optional = false), 0) AS expected
        FROM customers c
        LEFT JOIN voucher_entries ve ON ve.ledger_account_id = c.ledger_account_id
        LEFT JOIN vouchers v ON v.id = ve.voucher_id AND v.company_id = c.company_id
        GROUP BY c.company_id, c.id, c.opening_balance
      )
      SELECT l.company_id, l.customer_id, l.expected::text, latest.balance::text AS cached,
             (l.expected - latest.balance)::text AS difference
      FROM ledger l
      JOIN latest ON latest.company_id = l.company_id AND latest.customer_id = l.customer_id
      WHERE l.expected <> latest.balance
        AND ($1::int IS NULL OR l.company_id = $1)`,
  },
  {
    name: "supplier_balance_model",
    description:
      "Suppliers have opening balance plus direct voucher movements but no cached balance field to compare.",
    sql: `
      SELECT s.id AS supplier_id, s.code, s.opening_balance::text,
             COALESCE(SUM(ve.credit_amount - ve.debit_amount), 0)::text AS movement,
             'derived-only; no supplier currentBalance column' AS diagnostic
      FROM suppliers s
      LEFT JOIN voucher_entries ve ON ve.supplier_id = s.id
      GROUP BY s.id, s.code, s.opening_balance
      HAVING COALESCE(SUM(ve.credit_amount - ve.debit_amount), 0) <> 0`,
  },
  {
    name: "employee_balance_mismatch",
    description:
      "Employee currentBalance differs from opening balance plus voucher-entry movements.",
    sql: `
      SELECT e.company_id, e.id AS employee_id, e.code, e.current_balance::text AS cached,
             (COALESCE(e.opening_balance, 0) +
              COALESCE(SUM(ve.credit_amount - ve.debit_amount) FILTER (WHERE v.optional = false), 0))::text AS expected,
             (e.current_balance - COALESCE(e.opening_balance, 0) -
              COALESCE(SUM(ve.credit_amount - ve.debit_amount) FILTER (WHERE v.optional = false), 0))::text AS difference
      FROM employees e
      LEFT JOIN voucher_entries ve ON ve.employee_id = e.id
      LEFT JOIN vouchers v ON v.id = ve.voucher_id AND v.company_id = e.company_id
      WHERE ($1::int IS NULL OR e.company_id = $1)
      GROUP BY e.company_id, e.id, e.code, e.current_balance, e.opening_balance
      HAVING e.current_balance <> COALESCE(e.opening_balance, 0) +
             COALESCE(SUM(ve.credit_amount - ve.debit_amount) FILTER (WHERE v.optional = false), 0)`,
  },
  {
    name: "source_date_mismatch",
    description: "Voucher date differs from the linked source-document date.",
    sql: `
      SELECT 'container_sale' AS source_type, cs.id AS source_id, cs.company_id,
             cs.sale_date::text AS source_date, v.voucher_date::text AS voucher_date, v.id AS voucher_id
      FROM container_sales cs JOIN vouchers v ON v.id = cs.voucher_id
      WHERE cs.sale_date <> v.voucher_date
        AND ($1::int IS NULL OR cs.company_id = $1)
      UNION ALL
      SELECT 'salary_advance', sa.id, sa.company_id, sa.advance_date::text, v.voucher_date::text, v.id
      FROM salary_advances sa JOIN vouchers v ON v.id = sa.voucher_id
      WHERE sa.advance_date <> v.voucher_date
        AND ($1::int IS NULL OR sa.company_id = $1)`,
  },
  {
    name: "missing_historical_fx",
    description:
      "Non-USD source records cannot retain a historical rate because no exchange-rate column exists.",
    sql: `
      SELECT 'purchase_order' AS source_type, po.id AS source_id, po.company_id, po.currency,
             po.voucher_id, 'schema has no historical exchange_rate/base_amount fields' AS diagnostic
      FROM purchase_orders po
      WHERE upper(po.currency) <> 'USD' AND ($1::int IS NULL OR po.company_id = $1)
      UNION ALL
      SELECT 'container_sale', cs.id, cs.company_id, cs.currency, cs.voucher_id,
             'schema has no historical exchange_rate/base_amount fields'
      FROM container_sales cs
      WHERE upper(cs.currency) <> 'USD' AND ($1::int IS NULL OR cs.company_id = $1)`,
  },
  {
    name: "duplicate_voucher_signature",
    description: "Multiple vouchers share the same company/type/date/amount/description signature.",
    usesVoucherFilters: true,
    sql: `
      SELECT company_id, voucher_type, voucher_date, total_amount::text, COALESCE(description, '') AS description,
             COUNT(*)::int AS duplicate_count, ARRAY_AGG(id ORDER BY id) AS voucher_ids
      FROM filtered_vouchers
      GROUP BY company_id, voucher_type, voucher_date, total_amount, COALESCE(description, '')
      HAVING COUNT(*) > 1`,
  },
  {
    name: "deleted_source_active_accounting",
    description: "Deleted containers retain active purchase accounting vouchers.",
    sql: `
      SELECT c.company_id, c.id AS container_id, po.id AS purchase_order_id, po.voucher_id
      FROM containers c
      JOIN purchase_orders po ON po.container_id = c.id
      JOIN vouchers v ON v.id = po.voucher_id AND v.deleted_at IS NULL
      WHERE c.deleted_at IS NOT NULL
        AND ($1::int IS NULL OR c.company_id = $1)`,
  },
  {
    name: "active_source_missing_accounting",
    description: "Active source records have no linked accounting voucher.",
    sql: `
      SELECT 'purchase_order' AS source_type, po.id AS source_id, po.company_id
      FROM purchase_orders po JOIN containers c ON c.id = po.container_id
      WHERE po.voucher_id IS NULL AND c.deleted_at IS NULL
        AND ($1::int IS NULL OR po.company_id = $1)
      UNION ALL
      SELECT 'container_sale', cs.id, cs.company_id
      FROM container_sales cs
      WHERE cs.voucher_id IS NULL AND ($1::int IS NULL OR cs.company_id = $1)
      UNION ALL
      SELECT 'salary_advance', sa.id, sa.company_id
      FROM salary_advances sa
      WHERE sa.voucher_id IS NULL AND ($1::int IS NULL OR sa.company_id = $1)`,
  },
  {
    name: "trial_balance_difference",
    description: "Posted voucher-entry debit and credit difference by company.",
    usesVoucherFilters: true,
    sql: `
      SELECT v.company_id,
             COALESCE(SUM(ve.debit_amount), 0)::text AS debits,
             COALESCE(SUM(ve.credit_amount), 0)::text AS credits,
             (COALESCE(SUM(ve.debit_amount), 0) - COALESCE(SUM(ve.credit_amount), 0))::text AS difference
      FROM filtered_vouchers v
      JOIN voucher_entries ve ON ve.voucher_id = v.id
      WHERE v.optional = false
      GROUP BY v.company_id
      HAVING COALESCE(SUM(ve.debit_amount), 0) <> COALESCE(SUM(ve.credit_amount), 0)`,
  },
];

async function runCheck(
  client: PoolClient,
  check: AuditCheck,
  options: AuditOptions,
): Promise<AuditResult> {
  let query = check.sql;
  let values: unknown[] = [];

  if (check.usesVoucherFilters) {
    const filter = voucherFilter(options);
    values = filter.values;
    query = `WITH filtered_vouchers AS (SELECT v.* FROM vouchers v ${filter.clause}) ${query}`;
  } else if (query.includes("$1::int")) {
    values = [options.companyId ?? null];
  }

  values.push(options.limit);
  query = `${query}\nLIMIT $${values.length}`;
  const result = await client.query(query, values);
  return {
    check: check.name,
    description: check.description,
    count: result.rowCount ?? result.rows.length,
    rows: result.rows,
  };
}

function renderConsole(results: AuditResult[]): void {
  for (const result of results) {
    console.log(`\n[${result.check}] ${result.count} finding(s)`);
    console.log(result.description);
    if (result.rows.length > 0) console.table(result.rows);
  }
}

export async function runAudit(options: AuditOptions): Promise<AuditResult[]> {
  const url = connectionString();
  const host = (url.match(/@([^:/]+)/) ?? [])[1] ?? "";
  const useSsl =
    !["", "localhost", "127.0.0.1", "helium"].includes(host) && !host.endsWith(".internal");
  const pool = new Pool({
    connectionString: url,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  });
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const results: AuditResult[] = [];
    for (const check of CHECKS) results.push(await runCheck(client, check, options));
    await client.query("ROLLBACK");
    return results;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main(): Promise<void> {
  const options = parseAuditArgs(process.argv.slice(2));
  const results = await runAudit(options);
  if (options.output === "json") {
    console.log(
      JSON.stringify({ dryRun: true, readOnly: true, filters: options, results }, null, 2),
    );
  } else {
    console.log("Financial integrity audit (dry-run, READ ONLY)");
    renderConsole(results);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
