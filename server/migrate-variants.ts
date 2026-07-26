import { db } from "./db";
import { sql } from "drizzle-orm";

async function migrate() {
  await db.execute(sql`ALTER TABLE stock_items ADD COLUMN IF NOT EXISTS parent_stock_item_id INTEGER`);
  console.log("Migration OK: parent_stock_item_id added");
  process.exit(0);
}

migrate().catch((e) => { console.error(e); process.exit(1); });
