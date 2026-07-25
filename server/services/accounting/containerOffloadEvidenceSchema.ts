import {
  boolean,
  date,
  decimal,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const containerOffloadInventoryEvidence = pgTable(
  "container_offload_inventory_evidence",
  {
    id: serial("id").primaryKey(),
    offloadId: integer("offload_id").notNull(),
    containerId: integer("container_id").notNull(),
    companyId: integer("company_id").notNull(),
    locationId: integer("location_id").notNull(),
    inventoryId: integer("inventory_id").notNull(),
    stockItemId: integer("stock_item_id").notNull(),
    beforeExists: boolean("before_exists").notNull(),
    beforeQuantity: decimal("before_quantity", { precision: 15, scale: 3 }).notNull(),
    beforeAverageRate: decimal("before_average_rate", { precision: 20, scale: 2 }).notNull(),
    beforeTotalValue: decimal("before_total_value", { precision: 20, scale: 2 }).notNull(),
    afterQuantity: decimal("after_quantity", { precision: 15, scale: 3 }).notNull(),
    afterAverageRate: decimal("after_average_rate", { precision: 20, scale: 2 }).notNull(),
    afterTotalValue: decimal("after_total_value", { precision: 20, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueOffloadItem: uniqueIndex("container_offload_inventory_evidence_unique").on(
      table.offloadId,
      table.stockItemId,
    ),
  }),
);

export const containerOffloadVoucherLinks = pgTable(
  "container_offload_voucher_links",
  {
    id: serial("id").primaryKey(),
    offloadId: integer("offload_id").notNull(),
    containerId: integer("container_id").notNull(),
    companyId: integer("company_id").notNull(),
    voucherId: integer("voucher_id").notNull(),
    role: varchar("role", { length: 32 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueOffloadVoucher: uniqueIndex("container_offload_voucher_link_unique").on(
      table.offloadId,
      table.voucherId,
    ),
  }),
);

export const containerOffloadReversalLog = pgTable(
  "container_offload_reversal_log",
  {
    id: serial("id").primaryKey(),
    offloadId: integer("offload_id").notNull().unique(),
    containerId: integer("container_id").notNull(),
    companyId: integer("company_id").notNull(),
    transactionDate: date("transaction_date").notNull(),
    reason: text("reason"),
    idempotencyKey: text("idempotency_key").notNull(),
    createdBy: text("created_by"),
    snapshot: jsonb("snapshot").notNull(),
    reversalVoucherIds: jsonb("reversal_voucher_ids").notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqueCompanyIdentity: uniqueIndex("container_offload_reversal_idempotency_unique").on(
      table.companyId,
      table.idempotencyKey,
    ),
  }),
);

export type ContainerOffloadInventoryEvidence =
  typeof containerOffloadInventoryEvidence.$inferSelect;
