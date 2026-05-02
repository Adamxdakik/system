import { Pool } from "pg";

interface ColumnCheck {
  table: string;
  column: string;
}

interface TableCheck {
  table: string;
}

const REQUIRED_COLUMNS: ColumnCheck[] = [
  { table: "employees", column: "motos_bonus_rate" },
  { table: "container_offloads", column: "total_motos" },
  { table: "container_offloads", column: "additional_cost_per_moto" },
  // 0008: soft-delete columns
  { table: "employee_moto_rates", column: "deleted_at" },
  { table: "employee_moto_pct_rates", column: "deleted_at" },
];

const REQUIRED_TABLES: TableCheck[] = [
  { table: "employee_moto_rates" },
  { table: "employee_moto_pct_rates" },
  // 0009: audit log
  { table: "moto_rate_audit" },
];

const MUST_NOT_EXIST_COLUMNS: ColumnCheck[] = [
  { table: "employees", column: "bales_bonus_rate" },
  { table: "container_offloads", column: "total_bales" },
  { table: "container_offloads", column: "additional_cost_per_bale" },
];

async function main() {
  let connectionString: string;
  if (process.env.DATABASE_URL) {
    connectionString = process.env.DATABASE_URL;
  } else if (
    process.env.PGHOST &&
    process.env.PGPORT &&
    process.env.PGUSER &&
    process.env.PGPASSWORD &&
    process.env.PGDATABASE
  ) {
    const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
    connectionString = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
  } else {
    throw new Error("verify-moto-schema: no DATABASE_URL or PG* env vars set");
  }

  const dbHost = (connectionString.match(/@([^:\/]+)/) || [])[1] || "";
  const useSsl =
    !!dbHost &&
    !["helium", "localhost", "127.0.0.1"].includes(dbHost) &&
    !dbHost.endsWith(".internal");

  const pool = new Pool({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : false,
  });

  const errors: string[] = [];

  // 1. Required columns must exist
  for (const { table, column } of REQUIRED_COLUMNS) {
    const { rows } = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      [table, column],
    );
    if (rows.length === 0) {
      errors.push(`MISSING COLUMN: ${table}.${column}`);
    } else {
      console.log(`  ✓ column ${table}.${column}`);
    }
  }

  // 2. Required tables must exist
  for (const { table } of REQUIRED_TABLES) {
    const { rows } = await pool.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    );
    if (rows.length === 0) {
      errors.push(`MISSING TABLE: ${table}`);
    } else {
      console.log(`  ✓ table ${table}`);
    }
  }

  // 3. Old "bale" columns must not exist (rename should have happened)
  for (const { table, column } of MUST_NOT_EXIST_COLUMNS) {
    const { rows } = await pool.query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
      [table, column],
    );
    if (rows.length > 0) {
      errors.push(`STALE COLUMN STILL PRESENT: ${table}.${column} (rename migration did not run)`);
    } else {
      console.log(`  ✓ stale column ${table}.${column} absent`);
    }
  }

  await pool.end();

  if (errors.length > 0) {
    console.error("\nverify-moto-schema: FAIL");
    for (const err of errors) console.error(`  ✗ ${err}`);
    console.error("\nRun `npm run db:migrate` to bring the schema up to date.");
    process.exit(1);
  }

  console.log("\nverify-moto-schema: OK");
}

main().catch((err) => {
  console.error("verify-moto-schema: error", err);
  process.exit(1);
});
