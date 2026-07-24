import { pgTable, serial, text, integer, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";
import { suppliersTable } from "./suppliers";
import { stockItemsTable } from "./stockItems";
import { locationsTable } from "./locations";

export const containersTable = pgTable("containers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companiesTable.id),
  supplierId: integer("supplier_id").references(() => suppliersTable.id),
  containerNumber: text("container_number").notNull(),
  status: text("status").notNull().default("open"),
  importDate: date("import_date", { mode: "string" }),
  freightCost: numeric("freight_cost", { precision: 12, scale: 2 }),
  fumigationCost: numeric("fumigation_cost", { precision: 12, scale: 2 }),
  otherCharges: numeric("other_charges", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const containerItemsTable = pgTable("container_items", {
  id: serial("id").primaryKey(),
  containerId: integer("container_id").notNull().references(() => containersTable.id),
  stockItemId: integer("stock_item_id").references(() => stockItemsTable.id),
  itemName: text("item_name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
  ratePerUnit: numeric("rate_per_unit", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const containerOffloadsTable = pgTable("container_offloads", {
  id: serial("id").primaryKey(),
  containerId: integer("container_id").notNull().references(() => containersTable.id),
  locationId: integer("location_id").notNull().references(() => locationsTable.id),
  duties: numeric("duties", { precision: 20, scale: 2 }).notNull().default("0"),
  officeCharges: numeric("office_charges", { precision: 20, scale: 2 }).notNull().default("0"),
  transferCharges: numeric("transfer_charges", { precision: 20, scale: 2 }).notNull().default("0"),
  transportFees: numeric("transport_fees", { precision: 20, scale: 2 }).notNull().default("0"),
  totalCharges: numeric("total_charges", { precision: 20, scale: 2 }).notNull().default("0"),
  totalMotos: numeric("total_motos", { precision: 15, scale: 3 }).notNull().default("0"),
  additionalCostPerMoto: numeric("additional_cost_per_moto", { precision: 20, scale: 2 }).notNull().default("0"),
  offloadedAt: timestamp("offloaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const offloadItemsTable = pgTable("offload_items", {
  id: serial("id").primaryKey(),
  offloadId: integer("offload_id").notNull().references(() => containerOffloadsTable.id),
  stockItemId: integer("stock_item_id").references(() => stockItemsTable.id),
  stockItemName: text("stock_item_name"),
  stockItemCode: text("stock_item_code"),
  quantity: numeric("quantity", { precision: 15, scale: 3 }).notNull(),
  rate: numeric("rate", { precision: 20, scale: 2 }).notNull(),
  totalValue: numeric("total_value", { precision: 20, scale: 2 }).notNull(),
});

export const insertContainerSchema = createInsertSchema(containersTable).omit({ id: true, createdAt: true });
export type InsertContainer = z.infer<typeof insertContainerSchema>;
export type Container = typeof containersTable.$inferSelect;
export type ContainerItem = typeof containerItemsTable.$inferSelect;
export type ContainerOffload = typeof containerOffloadsTable.$inferSelect;
export type OffloadItem = typeof offloadItemsTable.$inferSelect;
