from pathlib import Path


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if new in source:
        return source
    if old not in source:
        raise SystemExit(f"{label} anchor not found")
    return source.replace(old, new, 1)


storage = Path("server/storage.ts")
source = storage.read_text()
source = replace_once(
    source,
    '''    return await db.transaction(async (tx) => {
      const inventoryEvidence: Array<{''',
    '''    return await db.transaction(async (tx) => {
      const [lockedContainer] = await tx
        .select({
          id: schema.containers.id,
          companyId: schema.containers.companyId,
          status: schema.containers.status,
        })
        .from(schema.containers)
        .where(eq(schema.containers.id, containerId))
        .for("update")
        .limit(1);
      if (!lockedContainer || lockedContainer.companyId !== container.companyId) {
        throw new Error(`Container ${containerId} not found`);
      }
      if (lockedContainer.status === "OFFLOADED") {
        throw new Error("Container is already offloaded");
      }

      const inventoryEvidence: Array<{''',
    "offload transaction lock",
)
storage.write_text(source)


test = Path("server/__tests__/containerOffloadReversal.postgres.ts")
source = test.read_text()
source = replace_once(
    source,
    '''await exactReversalScenario();
await changedInventoryScenario();
await legacyScenario();''',
    '''async function concurrentOffloadScenario() {
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
await concurrentOffloadScenario();''',
    "offload concurrency regression",
)
test.write_text(source)
