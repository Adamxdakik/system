import { Pool } from "pg";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.resolve(__dirname, "..", "migrations");

const MIN_TAG = "0006";

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
    const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");

    console.log(`migrate: applying ${tag} (idempotent)`);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        `INSERT INTO _idempotent_migrations (tag) VALUES ($1)
         ON CONFLICT (tag) DO UPDATE SET applied_at = now()`,
        [tag],
      );
      await client.query("COMMIT");
      console.log(`migrate: ✓ ${tag}`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`migrate: ✗ ${tag} failed`, err);
      throw err;
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
