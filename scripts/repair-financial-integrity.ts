import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { pathToFileURL } from "node:url";

import { Pool, type PoolClient } from "pg";

const SUPPORTED_CATEGORIES = ["rebuild-employee-balances", "restore-reversal-flags"] as const;
type RepairCategory = (typeof SUPPORTED_CATEGORIES)[number];

interface Options {
  companyId: number;
  categories: RepairCategory[];
  apply: boolean;
  generateToken: boolean;
  confirmationToken?: string;
  createdBy: string;
}

export function parseOptions(args: string[]): Options {
  const value = (name: string) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const companyId = Number(value("--company-id"));
  const categories = (value("--categories") ?? "").split(",").filter(Boolean) as RepairCategory[];
  if (!Number.isInteger(companyId) || companyId <= 0) {
    throw new Error("--company-id is required");
  }
  if (
    categories.length === 0 ||
    categories.some((category) => !SUPPORTED_CATEGORIES.includes(category))
  ) {
    throw new Error(`--categories must contain only: ${SUPPORTED_CATEGORIES.join(", ")}`);
  }
  return {
    companyId,
    categories: [...new Set(categories)].sort(),
    apply: args.includes("--apply"),
    generateToken: args.includes("--generate-token"),
    confirmationToken: value("--confirmation-token"),
    createdBy: value("--created-by") ?? "financial-repair-cli",
  };
}

function tokenPayload(options: Pick<Options, "companyId" | "categories">): string {
  const day = new Date().toISOString().slice(0, 10);
  return `${day}:${options.companyId}:${options.categories.join(",")}`;
}

export function createToken(
  options: Pick<Options, "companyId" | "categories">,
  secret: string,
): string {
  return createHmac("sha256", secret).update(tokenPayload(options)).digest("hex");
}

export function verifyToken(expected: string, provided: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return (
    expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes)
  );
}

async function employeeBalanceSnapshot(client: PoolClient, companyId: number) {
  const result = await client.query(
    `
      WITH movements AS (
        SELECT
          COALESCE(ve.employee_id, employee_by_account.id) AS employee_id,
          SUM(ve.credit_amount - ve.debit_amount) AS movement
        FROM voucher_entries ve
        JOIN vouchers v ON v.id = ve.voucher_id
        LEFT JOIN ledger_accounts la ON la.id = ve.ledger_account_id
        LEFT JOIN employees employee_by_account
          ON ve.employee_id IS NULL
         AND employee_by_account.company_id = v.company_id
         AND la.code = 'EMP-' || employee_by_account.code
        WHERE v.company_id = $1
          AND v.optional = false
          AND v.deleted_at IS NULL
          AND COALESCE(ve.employee_id, employee_by_account.id) IS NOT NULL
        GROUP BY COALESCE(ve.employee_id, employee_by_account.id)
      )
      SELECT
        e.id,
        e.current_balance::text AS current_balance,
        (
          COALESCE(e.opening_balance, 0) + COALESCE(m.movements, 0)
        )::numeric(15, 2)::text AS expected_balance
      FROM employees e
      LEFT JOIN (
        SELECT employee_id, movement AS movements FROM movements
      ) m ON m.employee_id = e.id
      WHERE e.company_id = $1
      ORDER BY e.id
    `,
    [companyId],
  );
  return result.rows;
}

async function reversalFlagSnapshot(client: PoolClient, companyId: number) {
  const result = await client.query(
    `
      SELECT
        original.id,
        original.reversed_at,
        count(reversal.id)::int AS reversal_count,
        min(reversal.created_at) AS proven_reversed_at
      FROM vouchers original
      LEFT JOIN vouchers reversal ON reversal.reversal_of_voucher_id = original.id
      WHERE original.company_id = $1
      GROUP BY original.id
      HAVING count(reversal.id) > 0
      ORDER BY original.id
    `,
    [companyId],
  );
  return result.rows;
}

async function runCategory(
  client: PoolClient,
  options: Options,
  category: RepairCategory,
  confirmationDigest: string | null,
) {
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock($1, $2)", [202_602, options.companyId]);
    let before: unknown;
    let after: unknown;

    if (category === "rebuild-employee-balances") {
      before = await employeeBalanceSnapshot(client, options.companyId);
      if (options.apply) {
        await client.query(
          `
            WITH movements AS (
              SELECT
                COALESCE(ve.employee_id, employee_by_account.id) AS employee_id,
                SUM(ve.credit_amount - ve.debit_amount) AS movement
              FROM voucher_entries ve
              JOIN vouchers v ON v.id = ve.voucher_id
              LEFT JOIN ledger_accounts la ON la.id = ve.ledger_account_id
              LEFT JOIN employees employee_by_account
                ON ve.employee_id IS NULL
               AND employee_by_account.company_id = v.company_id
               AND la.code = 'EMP-' || employee_by_account.code
              WHERE v.company_id = $1
                AND v.optional = false
                AND v.deleted_at IS NULL
                AND COALESCE(ve.employee_id, employee_by_account.id) IS NOT NULL
              GROUP BY COALESCE(ve.employee_id, employee_by_account.id)
            )
            UPDATE employees e
            SET current_balance = (
              COALESCE(e.opening_balance, 0) + COALESCE(m.movement, 0)
            )::numeric(15, 2)
            FROM (
              SELECT employees.id, movements.movement
              FROM employees
              LEFT JOIN movements ON movements.employee_id = employees.id
              WHERE employees.company_id = $1
            ) m
            WHERE e.id = m.id
          `,
          [options.companyId],
        );
      }
      after = await employeeBalanceSnapshot(client, options.companyId);
    } else {
      before = await reversalFlagSnapshot(client, options.companyId);
      const ambiguous = (before as Array<{ reversal_count: number }>).filter(
        (row) => row.reversal_count !== 1,
      );
      if (ambiguous.length > 0) {
        throw new Error(
          `Refusing ambiguous reversal rows: ${ambiguous.length} originals have multiple reversals`,
        );
      }
      if (options.apply) {
        await client.query(
          `
            UPDATE vouchers original
            SET reversed_at = proven.created_at
            FROM (
              SELECT reversal_of_voucher_id, min(created_at) AS created_at
              FROM vouchers
              WHERE company_id = $1 AND reversal_of_voucher_id IS NOT NULL
              GROUP BY reversal_of_voucher_id
              HAVING count(*) = 1
            ) proven
            WHERE original.company_id = $1
              AND original.id = proven.reversal_of_voucher_id
              AND original.reversed_at IS NULL
          `,
          [options.companyId],
        );
      }
      after = await reversalFlagSnapshot(client, options.companyId);
    }

    if (options.apply) {
      await client.query(
        `
          INSERT INTO financial_repair_audit (
            company_id, category, dry_run, confirmation_digest,
            before_state, after_state, created_by
          ) VALUES ($1, $2, false, $3, $4::jsonb, $5::jsonb, $6)
        `,
        [
          options.companyId,
          category,
          confirmationDigest,
          JSON.stringify(before),
          JSON.stringify(after),
          options.createdBy,
        ],
      );
    }
    await client.query("COMMIT");
    return { category, dryRun: !options.apply, before, after };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const secret = process.env.FINANCIAL_REPAIR_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("FINANCIAL_REPAIR_SECRET must contain at least 32 characters");
  }
  const expectedToken = createToken(options, secret);
  if (options.generateToken) {
    console.log(expectedToken);
    return;
  }
  if (options.apply) {
    if (process.env.ALLOW_FINANCIAL_REPAIR !== "true") {
      throw new Error("Apply mode requires ALLOW_FINANCIAL_REPAIR=true");
    }
    if (!options.confirmationToken || !verifyToken(expectedToken, options.confirmationToken)) {
      throw new Error("A valid, same-day confirmation token is required");
    }
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  const host = (connectionString.match(/@([^:/]+)/) ?? [])[1] ?? "";
  const pool = new Pool({
    connectionString,
    ssl:
      host && !["localhost", "127.0.0.1", "helium"].includes(host)
        ? { rejectUnauthorized: false }
        : false,
  });
  const results = [];
  try {
    for (const category of options.categories) {
      const client = await pool.connect();
      try {
        results.push(
          await runCategory(
            client,
            options,
            category,
            options.apply
              ? createHash("sha256")
                  .update(options.confirmationToken ?? "")
                  .digest("hex")
              : null,
          ),
        );
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.end();
  }
  console.log(JSON.stringify({ companyId: options.companyId, results }, null, 2));
}

const executedPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === executedPath) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
