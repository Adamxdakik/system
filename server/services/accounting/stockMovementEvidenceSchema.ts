import { decimal, integer, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const stockMovementCostEvidence = pgTable(
  "stock_movement_cost_evidence",
  {
    id: serial("id").primaryKey(),
    companyId: integer("company_id").notNull(),
    originalVoucherId: integer("original_voucher_id").notNull(),
    movementKind: varchar("movement_kind", { length: 20 }).notNull(),
    movementItemId: integer("movement_item_id").notNull(),
    stockItemId: integer("stock_item_id").notNull(),
    sourceLocationId: integer("source_location_id"),
    destinationLocationId: integer("destination_location_id"),
    quantity: decimal("quantity", { precision: 15, scale: 3 }).notNull(),
    actualUnitCost: decimal("actual_unit_cost", { precision: 20, scale: 6 }).notNull(),
    actualTotalCost: decimal("actual_total_cost", { precision: 20, scale: 2 }).notNull(),
    evidenceStatus: varchar("evidence_status", { length: 32 }).notNull(),
    reversedByVoucherId: integer("reversed_by_voucher_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueMovementItem: uniqueIndex("stock_movement_evidence_item_unique").on(
      table.movementKind,
      table.movementItemId,
    ),
    voucherLookup: uniqueIndex("stock_movement_evidence_voucher_item_unique").on(
      table.originalVoucherId,
      table.movementKind,
      table.movementItemId,
    ),
  }),
);

export type StockMovementCostEvidence = typeof stockMovementCostEvidence.$inferSelect;
