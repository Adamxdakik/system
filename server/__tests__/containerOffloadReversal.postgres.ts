import { and, eq } from "drizzle-orm";

import { db } from "../db";
import { storage } from "../storage";
import {
  companies,
  containerItems,
  containerOffloads,
  containers,
  inventory,
  ledgerAccounts,
  locations,
  stockGroups,
  stockItems,
  suppliers,
  vouchers,
} from "@shared/schema";
import {
  containerOffloadInventoryEvidence,
  containerOffloadReversalLog,
  containerOffloadVoucherLinks,
} from "../services/accounting/containerOffloadEvidenceSchema";
import { containerOffloadReversalService } from "../services/accounting/containerOffloadReversalService";
import { AccountingIntegrityError } from "../services/accounting/voucherPostingService";

if (!process.argv.includes("--confirm-disposable")) {
  throw new Error("Pass --confirm-disposable to run container offload PostgreSQL regressions");
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

async function fixture(label: string) {
  const [company] = await db
    .insert(companies)
    .values({ code: `OFF-${label}-${suffix}`, name: `Offload ${label} ${suffix}` })
    .returning();
  const [supplier] = await db
    .insert(suppliers)
    .values({
      companyId: company.id,
      code: `SUP-${label}-${suffix}`,
      legalName: `Supplier ${label}`,
      email: `${label.toLowerCase()}-${suffix}@example.test`,
    })
    .returning();
  const [location] = await db
    .insert(locations)
    .values({
      companyId: company.id,
      code: `LOC-${label}-${suffix}`,
      name: `Location ${label}`,
    })
    .returning();
  const [group] = await db
    .insert(stockGroups)
    .values({
      companyId: company.id,
      code: `GRP-${label}-${suffix}`,
      name: `Group ${label}`,
      allocateImportCosts: true,
    })
    .returning();
  const [item] = await db
    .insert(stockItems)
    .values({
      companyId: company.id,
      code: `ITEM-${label}-${suffix}`,
      name: `Item ${label}`,
      stockGroupId: group.id,
      uom: "pcs",
    })
    .returning();
  const [dutyAgent] = await db
    .insert(ledgerAccounts)
    .values({
      companyId: company.id,
      code: `DUTY-AGENT-${label}-${suffix}`,
      name: `Duty Agent ${label}`,
      accountType: "Liability",
      openingBalance: "0",
      openingBalanceSide: "Cr",
    })
    .returning();
  const [container] = await db
    .insert(containers)
    .values({
      companyId: company.id,
      containerNumber: `CONT-${label}-${suffix}`,
      supplierId: supplier.id,
      status: "IN_TRANSIT",
      importDate: "2026-07-01",
      chargesTotal: "0",
    })
    .returning();
  await db.insert(containerItems).values({
    containerId: container.id,
    stockItemId: item.id,
    itemName: item.name,
    quantity: "10.000",
    ratePerKg: "2.00",
    weightKg: "10.000",
    lineTotal: "20.00",
  });
  return { company, location, item, dutyAgent, container };
}

async function exactReversalScenario() {
  const data = await fixture("EXACT");
  const offload = await storage.offloadContainer(
    data.container.id,
    data.location.id,
    "10.00",
    data.dutyAgent.id,
    "0",
    null,
    [],
    "2026-07-10",
    [],
  );

  const evidence = await db
    .select()
    .from(containerOffloadInventoryEvidence)
    .where(eq(containerOffloadInventoryEvidence.offloadId, offload.id));
  const links = await db
    .select()
    .from(containerOffloadVoucherLinks)
    .where(eq(containerOffloadVoucherLinks.offloadId, offload.id));
  assert(evidence.length === 1, "offload must persist one exact inventory snapshot");
  assert(links.length === 1, "offload must link its duties voucher");

  const result = await containerOffloadReversalService.reverse({
    companyId: data.company.id,
    containerId: data.container.id,
    transactionDate: "2026-07-11",
    reason: "Disposable exact reversal test",
    idempotencyKey: `OFFLOAD-REVERSAL-${suffix}`,
    createdBy: null,
  });
  assert(!result.duplicate, "first reversal must not be marked duplicate");
  assert(result.reversalVoucherIds.length === 1, "linked duties voucher must be reversed");

  const [remainingInventory] = await db
    .select()
    .from(inventory)
    .where(
      and(
        eq(inventory.companyId, data.company.id),
        eq(inventory.locationId, data.location.id),
        eq(inventory.stockItemId, data.item.id),
      ),
    )
    .limit(1);
  assert(
    !remainingInventory,
    "reversal must restore the exact pre-offload missing inventory state",
  );

  const [updatedContainer] = await db
    .select()
    .from(containers)
    .where(eq(containers.id, data.container.id));
  assert(updatedContainer.status === "IN_TRANSIT", "container must return to IN_TRANSIT");

  const [activeOffload] = await db
    .select()
    .from(containerOffloads)
    .where(eq(containerOffloads.id, offload.id));
  assert(!activeOffload, "active offload row must be removed after audit snapshot is retained");

  const [originalVoucher] = await db
    .select()
    .from(vouchers)
    .where(eq(vouchers.id, links[0].voucherId));
  assert(originalVoucher.reversedAt, "original offload voucher must remain and be marked reversed");

  const [log] = await db
    .select()
    .from(containerOffloadReversalLog)
    .where(eq(containerOffloadReversalLog.offloadId, offload.id));
  assert(log, "immutable offload reversal log must be retained");

  const duplicate = await containerOffloadReversalService.reverse({
    companyId: data.company.id,
    containerId: data.container.id,
    transactionDate: "2026-07-11",
    reason: "Disposable exact reversal test",
    idempotencyKey: `OFFLOAD-REVERSAL-${suffix}`,
    createdBy: null,
  });
  assert(duplicate.duplicate, "same reversal identity must return the existing result");
}

async function changedInventoryScenario() {
  const data = await fixture("CHANGED");
  const offload = await storage.offloadContainer(
    data.container.id,
    data.location.id,
    "10.00",
    data.dutyAgent.id,
    "0",
    null,
    [],
    "2026-07-12",
    [],
  );
  const [row] = await db
    .select()
    .from(inventory)
    .where(
      and(
        eq(inventory.companyId, data.company.id),
        eq(inventory.locationId, data.location.id),
        eq(inventory.stockItemId, data.item.id),
      ),
    );
  await db
    .update(inventory)
    .set({ quantity: "9.000", totalValue: "27.00" })
    .where(eq(inventory.id, row.id));

  let error: unknown;
  try {
    await containerOffloadReversalService.reverse({
      companyId: data.company.id,
      containerId: data.container.id,
      transactionDate: "2026-07-13",
      idempotencyKey: `OFFLOAD-CHANGED-${suffix}`,
    });
  } catch (caught) {
    error = caught;
  }
  assert(
    error instanceof AccountingIntegrityError,
    "changed inventory must fail with integrity error",
  );
  assert(error.code === "OFFLOAD_INVENTORY_CHANGED", "changed inventory must fail closed");

  const [stillOffloaded] = await db
    .select()
    .from(containerOffloads)
    .where(eq(containerOffloads.id, offload.id));
  assert(stillOffloaded, "failed reversal must keep the original offload active");
  const [linked] = await db
    .select()
    .from(containerOffloadVoucherLinks)
    .where(eq(containerOffloadVoucherLinks.offloadId, offload.id));
  const [voucher] = await db.select().from(vouchers).where(eq(vouchers.id, linked.voucherId));
  assert(!voucher.reversedAt, "failed reversal must not partially reverse accounting");
}

async function legacyScenario() {
  const data = await fixture("LEGACY");
  await db
    .update(containers)
    .set({ status: "OFFLOADED" })
    .where(eq(containers.id, data.container.id));
  const [offload] = await db
    .insert(containerOffloads)
    .values({
      containerId: data.container.id,
      locationId: data.location.id,
      duties: "0",
      officeCharges: "0",
      transferCharges: "0",
      transportFees: "0",
      totalCharges: "0",
      totalMotos: "10.000",
      additionalCostPerMoto: "0",
      offloadedAt: new Date("2026-07-14T00:00:00Z"),
    })
    .returning();

  let error: unknown;
  try {
    await containerOffloadReversalService.reverse({
      companyId: data.company.id,
      containerId: data.container.id,
      transactionDate: "2026-07-15",
      idempotencyKey: `OFFLOAD-LEGACY-${suffix}`,
    });
  } catch (caught) {
    error = caught;
  }
  assert(
    error instanceof AccountingIntegrityError,
    "legacy reversal must fail with integrity error",
  );
  assert(
    error.code === "LEGACY_OFFLOAD_EVIDENCE_MISSING",
    "legacy reversal must refuse to invent inventory history",
  );
  const [stillActive] = await db
    .select()
    .from(containerOffloads)
    .where(eq(containerOffloads.id, offload.id));
  assert(stillActive, "legacy refusal must not mutate the offload");
}

async function concurrentOffloadScenario() {
  const data = await fixture("CONCURRENT");
  const args = [
    data.container.id,
    data.location.id,
    "10.00",
    data.dutyAgent.id,
    "0",
    null,
    [],
    "2026-07-16",
    [],
  ] as const;

  const results = await Promise.allSettled([
    storage.offloadContainer(...args),
    storage.offloadContainer(...args),
  ]);
  const fulfilled = results.filter((result) => result.status === "fulfilled");
  const rejected = results.filter((result) => result.status === "rejected");
  assert(fulfilled.length === 1, "exactly one concurrent offload must commit");
  assert(rejected.length === 1, "the duplicate concurrent offload must fail closed");

  const rows = await db
    .select()
    .from(containerOffloads)
    .where(eq(containerOffloads.containerId, data.container.id));
  assert(rows.length === 1, "concurrent requests must create one offload row");

  const [stock] = await db
    .select()
    .from(inventory)
    .where(
      and(
        eq(inventory.companyId, data.company.id),
        eq(inventory.locationId, data.location.id),
        eq(inventory.stockItemId, data.item.id),
      ),
    );
  assert(stock.quantity === "10.000", "concurrent requests must not double inventory");
}

await exactReversalScenario();
await changedInventoryScenario();
await legacyScenario();
await concurrentOffloadScenario();
console.log("Container offload reversal PostgreSQL regressions passed");
