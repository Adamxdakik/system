import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const stockGroupsTable = pgTable("stock_groups", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companiesTable.id),
  name: text("name").notNull(),
  code: text("code").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStockGroupSchema = createInsertSchema(stockGroupsTable).omit({ id: true, createdAt: true });
export type InsertStockGroup = z.infer<typeof insertStockGroupSchema>;
export type StockGroup = typeof stockGroupsTable.$inferSelect;
