import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "@shared/schema";

// Supports both managed DATABASE_URL connections and individual PG* variables.
let connectionString: string;
let dbHost = "";

if (process.env.DATABASE_URL) {
  connectionString = process.env.DATABASE_URL;
  try {
    dbHost = new URL(connectionString).hostname;
  } catch {
    const match = connectionString.match(/@([^:/]+)/);
    dbHost = match ? match[1] : "";
  }
  console.log("✓ Using DATABASE_URL for PostgreSQL connection");
} else if (
  process.env.PGHOST &&
  process.env.PGPORT &&
  process.env.PGUSER &&
  process.env.PGPASSWORD &&
  process.env.PGDATABASE
) {
  const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env;
  connectionString = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT}/${PGDATABASE}`;
  dbHost = PGHOST;
  console.log("✓ Using PostgreSQL connection variables");
} else {
  throw new Error(
    "No database configuration found. Set DATABASE_URL or provision a PostgreSQL database.",
  );
}

console.log("Database connection endpoint:", connectionString.replace(/:[^:@]*@/, ":***@"));

const normalizedHost = dbHost.trim().toLowerCase();
const localHosts = new Set(["helium", "localhost", "127.0.0.1", "::1"]);
const isLocalDatabase = localHosts.has(normalizedHost) || normalizedHost.endsWith(".internal");
const sslMode = process.env.PGSSLMODE?.trim().toLowerCase();
const sslExplicitlyDisabled = sslMode === "disable";
const sslExplicitlyRequired = ["require", "verify-ca", "verify-full"].includes(sslMode ?? "");
const requiresSSL = sslExplicitlyRequired || (!isLocalDatabase && !sslExplicitlyDisabled);

if (requiresSSL) {
  console.log("✓ SSL enabled for external database connection");
} else if (isLocalDatabase) {
  console.log(`ℹ️  SSL disabled for local database (${normalizedHost || "unknown host"})`);
} else {
  console.warn(
    "⚠️  SSL disabled via PGSSLMODE=disable - ensure this is intentional for your environment",
  );
}

const pool = new Pool({
  connectionString,
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
