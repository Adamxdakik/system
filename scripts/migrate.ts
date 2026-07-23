import { Pool } from "pg";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "..", "migrations");

const MIN_TAG = "0000";

// PostgreSQL error codes that mean "this object already exists"
const ALREADY_EXISTS_CODES = new Set([
  "42P07", // duplicate_table
  "42710", // duplicate_object (index, constraint, etc.)
  "42701", // duplicate_column
  "42P16", // invalid_table_definition (constraint already exists in some PG versions)
  "23505", // unique_violation (already-applied unique constraint seeds)
]);

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
    throw new Error("migrate: no DATABASE_URL or PG* env vars set");
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _idempotent_migrations (
      tag text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .filter((f) => f.localeCompare(MIN_TAG) >= 0)
    .sort();

  if (files.length === 0) {
    console.log(`migrate: no SQL files >= ${MIN_TAG} to consider, exiting`);
    await pool.end();
    return;
  }

  for (const file of files) {
    const tag = file.replace(/\.sql$/, "");

    // Skip if already recorded as applied
    const { rows: already } = await pool.query(
      `SELECT 1 FROM _idempotent_migrations WHERE tag = $1`,
      [tag],
    );
    if (already.length > 0) {
      console.log(`migrate: → ${tag} already applied, skipping`);
      continue;
    }

    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
    console.log(`migrate: applying ${tag}`);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        `INSERT INTO _idempotent_migrations (tag) VALUES ($1)`,
        [tag],
      );
      await client.query("COMMIT");
      console.log(`migrate: ✓ ${tag}`);
    } catch (err: any) {
      await client.query("ROLLBACK");

      const isAlreadyExists =
        ALREADY_EXISTS_CODES.has(err.code) ||
        String(err.message).toLowerCase().includes("already exists");

      if (isAlreadyExists) {
        // Schema was pre-created (e.g. via drizzle-kit push on a prior deploy).
        // Mark the migration as applied so future runs skip it cleanly.
        await pool.query(
          `INSERT INTO _idempotent_migrations (tag) VALUES ($1) ON CONFLICT (tag) DO NOTHING`,
          [tag],
        );
        console.warn(
          `migrate: ⚠ ${tag} — schema already present, marking as applied`,
        );
      } else {
        console.error(`migrate: ✗ ${tag} failed`, err);
        throw err;
      }
    } finally {
      client.release();
    }
  }

  await pool.end();
  console.log("migrate: done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
