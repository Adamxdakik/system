import { pgTable, serial, text, boolean, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { stockGroupsTable } from "./stockGroups";

export const stockItemsTable = pgTable("stock_items", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companiesTable.id),
  stockGroupId: integer("stock_group_id").references(() => stockGroupsTable.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
  uom: text("uom").notNull().default("pcs"),
  sellingPrice: numeric("selling_price", { precision: 12, scale: 2 }),
  openingQty: numeric("opening_qty", { precision: 12, scale: 4 }),
  openingRate: numeric("opening_rate", { precision: 12, scale: 2 }),
  reorderLevel: numeric("reorder_level", { precision: 12, scale: 4 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStockItemSchema = createInsertSchema(stockItemsTable).omit({ id: true, createdAt: true });
export type InsertStockItem = z.infer<typeof insertStockItemSchema>;
export type StockItem = typeof stockItemsTable.$inferSelect;
