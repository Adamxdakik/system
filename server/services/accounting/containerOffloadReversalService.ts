import { and, desc, eq } from "drizzle-orm";

import { db } from "../../db";
import { containerOffloads, containers, inventory } from "@shared/schema";
import {
  accountingTransactionFor,
  type DrizzleTransaction,
} from "./drizzleAccountingStore";
import {
  containerOffloadInventoryEvidence,
  containerOffloadReversalLog,
  containerOffloadVoucherLinks,
} from "./containerOffloadEvidenceSchema";
import type { VoucherPostingInput } from "./types";
import {
  AccountingIntegrityError,
  postVoucherInTransaction,
} from "./voucherPostingService";

export interface ReverseContainerOffloadInput {
  companyId: number;
  containerId: number;
  transactionDate: string;
  reason?: string | null;
  idempotencyKey: string;
  createdBy?: string | null;
}

export interface ContainerOffloadReversalResult {
  offloadId: number;
  containerId: number;
  reversalVoucherIds: number[];
  duplicate: boolean;
}

function integrity(message: string, code: string, status = 409): never {
  throw new AccountingIntegrityError(message, code, status);
}

function validDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    integrity("A valid transactionDate is required", "INVALID_TRANSACTION_DATE", 400);
  }
  return value;
}

function sameDecimal(left: string, right: string): boolean {
  return Number(left) === Number(right);
}

async function existingReversal(
  tx: DrizzleTransaction,
  companyId: number,
  containerId: number,
  idempotencyKey: string,
): Promise<ContainerOffloadReversalResult | null> {
  const [row] = await tx
    .select()
    .from(containerOffloadReversalLog)
    .where(
      and(
        eq(containerOffloadReversalLog.companyId, companyId),
        eq(containerOffloadReversalLog.containerId, containerId),
      ),
    )
    .orderBy(desc(containerOffloadReversalLog.createdAt))
    .limit(1);
  if (!row) return null;
  if (row.idempotencyKey !== idempotencyKey) {
    integrity(
      "This container offload was already reversed with a different request identity",
      "CONTAINER_OFFLOAD_ALREADY_REVERSED",
    );
  }
  return {
    offloadId: row.offloadId,
    containerId: row.containerId,
    reversalVoucherIds: Array.isArray(row.reversalVoucherIds)
      ? row.reversalVoucherIds.map(Number)
      : [],
    duplicate: true,
  };
}

async function reverseLinkedVoucher(
  tx: DrizzleTransaction,
  input: ReverseContainerOffloadInput,
  offloadId: number,
  voucherId: number,
): Promise<number> {
  const accountingTx = accountingTransactionFor(tx);
  const original = await accountingTx.loadVoucherForReversal(input.companyId, voucherId);
  if (!original) {
    integrity(
      `Linked offload voucher ${voucherId} is missing`,
      "OFFLOAD_LINKED_VOUCHER_MISSING",
    );
  }
  if (original.voucher.reversedAt) {
    integrity(
      `Linked offload voucher ${voucherId} was already reversed outside this workflow`,
      "OFFLOAD_LINKED_VOUCHER_ALREADY_REVERSED",
    );
  }
  if (original.voucher.optional) {
    integrity(
      `Linked offload voucher ${voucherId} is still a draft`,
      "OFFLOAD_LINKED_VOUCHER_DRAFT",
    );
  }

  const reversalInput: VoucherPostingInput = {
    companyId: input.companyId,
    voucherType: original.voucher.voucherType as VoucherPostingInput["voucherType"],
    voucherNumber: `REV-OFFLOAD-${offloadId}-${voucherId}`,
    transactionDate: input.transactionDate,
    description: input.reason ?? `Reversal of container offload voucher ${voucherId}`,
    currency: original.voucher.currency,
    exchangeRate: original.voucher.exchangeRate,
    sourceType: "CONTAINER_OFFLOAD_REVERSAL",
    sourceId: `${offloadId}:${voucherId}`,
    idempotencyKey: `${input.idempotencyKey}:voucher:${voucherId}`,
    createdBy: input.createdBy,
    entries: original.entries.map((entry) => ({
      ledgerAccountId: entry.ledgerAccountId,
      bankAccountId: entry.bankAccountId,
      fixedAssetId: entry.fixedAssetId,
      customerId: entry.customerId,
      supplierId: entry.supplierId,
      employeeId: entry.employeeId,
      debitAmount: entry.creditAmount,
      creditAmount: entry.debitAmount,
      description: entry.description,
      currency: entry.currency,
      foreignAmount: entry.foreignAmount,
      exchangeRate: entry.exchangeRate,
      baseAmount: entry.baseAmount,
    })),
  };

  const reversal = await postVoucherInTransaction(
    accountingTx,
    reversalInput,
    original.voucher.id,
  );
  if (!reversal.duplicate) {
    await accountingTx.markReversed(original.voucher.id, new Date());
  }
  return reversal.voucher.id;
}

export class ContainerOffloadReversalService {
  reverse(input: ReverseContainerOffloadInput): Promise<ContainerOffloadReversalResult> {
    const transactionDate = validDate(input.transactionDate);
    if (!input.idempotencyKey.trim()) {
      integrity("Idempotency key is required", "IDEMPOTENCY_KEY_REQUIRED", 400);
    }

    return db.transaction(async (tx) => {
      const [container] = await tx
        .select()
        .from(containers)
        .where(
          and(eq(containers.id, input.containerId), eq(containers.companyId, input.companyId)),
        )
        .for("update")
        .limit(1);
      if (!container) integrity("Container not found", "CONTAINER_NOT_FOUND", 404);

      const [offload] = await tx
        .select()
        .from(containerOffloads)
        .where(eq(containerOffloads.containerId, input.containerId))
        .for("update")
        .limit(1);

      if (!offload) {
        const duplicate = await existingReversal(
          tx,
          input.companyId,
          input.containerId,
          input.idempotencyKey,
        );
        if (duplicate) return duplicate;
        integrity(
          "No active offload record was found. Legacy status-only reversal is disabled.",
          "OFFLOAD_RECORD_MISSING",
        );
      }
      if (container.status !== "OFFLOADED") {
        integrity("Container is not offloaded", "CONTAINER_NOT_OFFLOADED");
      }

      const evidence = await tx
        .select()
        .from(containerOffloadInventoryEvidence)
        .where(
          and(
            eq(containerOffloadInventoryEvidence.offloadId, offload.id),
            eq(containerOffloadInventoryEvidence.companyId, input.companyId),
          ),
        );
      if (evidence.length === 0) {
        integrity(
          "This offload predates exact reversal evidence. Review it manually instead of guessing inventory value.",
          "LEGACY_OFFLOAD_EVIDENCE_MISSING",
        );
      }

      const lockedInventory = new Map<number, typeof inventory.$inferSelect>();
      for (const row of evidence) {
        const [current] = await tx
          .select()
          .from(inventory)
          .where(
            and(
              eq(inventory.id, row.inventoryId),
              eq(inventory.companyId, input.companyId),
              eq(inventory.locationId, row.locationId),
              eq(inventory.stockItemId, row.stockItemId),
            ),
          )
          .for("update")
          .limit(1);
        if (!current) {
          integrity(
            `Inventory row for stock item ${row.stockItemId} no longer exists`,
            "OFFLOAD_INVENTORY_CHANGED",
          );
        }
        if (
          !sameDecimal(current.quantity, row.afterQuantity) ||
          !sameDecimal(current.averageRate, row.afterAverageRate) ||
          !sameDecimal(current.totalValue, row.afterTotalValue)
        ) {
          integrity(
            `Inventory for stock item ${row.stockItemId} changed after offload. Reverse later sales/transfers first.`,
            "OFFLOAD_INVENTORY_CHANGED",
          );
        }
        lockedInventory.set(row.id, current);
      }

      const links = await tx
        .select()
        .from(containerOffloadVoucherLinks)
        .where(
          and(
            eq(containerOffloadVoucherLinks.offloadId, offload.id),
            eq(containerOffloadVoucherLinks.companyId, input.companyId),
          ),
        );

      const reversalVoucherIds: number[] = [];
      for (const link of links) {
        reversalVoucherIds.push(
          await reverseLinkedVoucher(tx, { ...input, transactionDate }, offload.id, link.voucherId),
        );
      }

      for (const row of evidence) {
        const current = lockedInventory.get(row.id)!;
        if (!row.beforeExists) {
          await tx.delete(inventory).where(eq(inventory.id, current.id));
        } else {
          await tx
            .update(inventory)
            .set({
              quantity: row.beforeQuantity,
              averageRate: row.beforeAverageRate,
              totalValue: row.beforeTotalValue,
              lastUpdated: new Date(),
            })
            .where(eq(inventory.id, current.id));
        }
      }

      await tx.insert(containerOffloadReversalLog).values({
        offloadId: offload.id,
        containerId: input.containerId,
        companyId: input.companyId,
        transactionDate,
        reason: input.reason ?? null,
        idempotencyKey: input.idempotencyKey,
        createdBy: input.createdBy ?? null,
        snapshot: { offload, evidence, links },
        reversalVoucherIds,
      });

      await tx.delete(containerOffloads).where(eq(containerOffloads.id, offload.id));
      await tx
        .update(containers)
        .set({ status: "IN_TRANSIT" })
        .where(
          and(eq(containers.id, input.containerId), eq(containers.companyId, input.companyId)),
        );

      return {
        offloadId: offload.id,
        containerId: input.containerId,
        reversalVoucherIds,
        duplicate: false,
      };
    });
  }
}

export const containerOffloadReversalService = new ContainerOffloadReversalService();
