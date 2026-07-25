import { Pool, type QueryResultRow } from "pg";

interface Options {
  confirmNonProduction: boolean;
  output: "console" | "json";
}

function parseArgs(argv: string[]): Options {
  const options: Options = { confirmNonProduction: false, output: "console" };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--confirm-non-production") {
      options.confirmNonProduction = true;
    } else if (argument === "--output") {
      const value = argv[index + 1];
      if (value !== "console" && value !== "json") {
        throw new Error("--output must be console or json");
      }
      options.output = value;
      index += 1;
    } else if (argument === "--help" || argument === "-h") {
      console.log(
        [
          "Read-only supplier company assignment audit",
          "",
          "Usage:",
          "  npm run audit:supplier-companies -- --confirm-non-production [--output console|json]",
          "",
          "The audit never updates suppliers. SAFE_ASSIGN rows still require an explicit",
          "reviewed repair step; AMBIGUOUS and NO_EVIDENCE rows are never guessed.",
        ].join("\n"),
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
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
  throw new Error("DATABASE_URL or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE is required");
}

const AUDIT_SQL = `
WITH evidence AS (
  SELECT supplier_id, company_id, 'purchase_order'::text AS source
  FROM purchase_orders
  WHERE supplier_id IS NOT NULL AND company_id IS NOT NULL

  UNION ALL

  SELECT supplier_id, company_id, 'container'::text AS source
  FROM containers
  WHERE supplier_id IS NOT NULL AND company_id IS NOT NULL

  UNION ALL

  SELECT ve.supplier_id, v.company_id, 'voucher_entry'::text AS source
  FROM voucher_entries ve
  JOIN vouchers v ON v.id = ve.voucher_id
  WHERE ve.supplier_id IS NOT NULL
    AND v.company_id IS NOT NULL
    AND v.deleted_at IS NULL
), evidence_summary AS (
  SELECT
    supplier_id,
    array_agg(DISTINCT company_id ORDER BY company_id) AS evidence_company_ids,
    jsonb_object_agg(source, source_count) AS evidence_counts
  FROM (
    SELECT supplier_id, company_id, source, count(*) AS source_count
    FROM evidence
    GROUP BY supplier_id, company_id, source
  ) grouped_evidence
  GROUP BY supplier_id
)
SELECT
  s.id AS supplier_id,
  s.code AS supplier_code,
  s.legal_name,
  s.company_id AS current_company_id,
  coalesce(es.evidence_company_ids, ARRAY[]::integer[]) AS evidence_company_ids,
  coalesce(es.evidence_counts, '{}'::jsonb) AS evidence_counts,
  CASE
    WHEN cardinality(coalesce(es.evidence_company_ids, ARRAY[]::integer[])) = 0
      THEN 'NO_EVIDENCE'
    WHEN cardinality(es.evidence_company_ids) > 1
      THEN 'AMBIGUOUS'
    WHEN s.company_id IS NULL
      THEN 'SAFE_ASSIGN'
    WHEN s.company_id = es.evidence_company_ids[1]
      THEN 'ASSIGNED_MATCH'
    ELSE 'ASSIGNED_CONFLICT'
  END AS status,
  CASE
    WHEN cardinality(es.evidence_company_ids) = 1 THEN es.evidence_company_ids[1]
    ELSE NULL
  END AS proposed_company_id
FROM suppliers s
LEFT JOIN evidence_summary es ON es.supplier_id = s.id
ORDER BY
  CASE
    WHEN cardinality(coalesce(es.evidence_company_ids, ARRAY[]::integer[])) > 1 THEN 1
    WHEN s.company_id IS NOT NULL
      AND cardinality(coalesce(es.evidence_company_ids, ARRAY[]::integer[])) = 1
      AND s.company_id <> es.evidence_company_ids[1] THEN 2
    WHEN s.company_id IS NULL
      AND cardinality(coalesce(es.evidence_company_ids, ARRAY[]::integer[])) = 0 THEN 3
    WHEN s.company_id IS NULL THEN 4
    ELSE 5
  END,
  s.id;
`;

function summarize(rows: QueryResultRow[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const status = String(row.status);
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const pool = new Pool({ connectionString: connectionString(), max: 1 });
  const client = await pool.connect();

  try {
    await client.query("BEGIN READ ONLY");
    const result = await client.query(AUDIT_SQL);
    await client.query("ROLLBACK");

    const report = {
      generatedAt: new Date().toISOString(),
      readOnly: true,
      summary: summarize(result.rows),
      suppliers: result.rows,
    };

    if (options.output === "json") {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log("Supplier company assignment audit (read-only)");
      console.table(report.summary);
      console.table(
        result.rows.map((row) => ({
          supplierId: row.supplier_id,
          code: row.supplier_code,
          name: row.legal_name,
          currentCompanyId: row.current_company_id,
          evidenceCompanyIds: row.evidence_company_ids,
          proposedCompanyId: row.proposed_company_id,
          status: row.status,
        })),
      );
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
