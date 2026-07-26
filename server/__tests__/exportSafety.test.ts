import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { write } from "../lib/excel";
import {
  assertWorkbookWithinLimits,
  ExportCapacityError,
  ExportConcurrencyGate,
  workbookMetrics,
} from "../services/performance/exportSafety";

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("export safety", () => {
  it("counts worksheets, rows, and populated cells", () => {
    const workbook = new ExcelJS.Workbook();
    const first = workbook.addWorksheet("First");
    first.addRow(["Code", "Name"]);
    first.addRow(["A", "Alpha"]);
    const second = workbook.addWorksheet("Second");
    second.addRow(["Only"]);

    expect(workbookMetrics(workbook)).toEqual({
      worksheets: 2,
      rows: 3,
      cells: 5,
    });
  });

  it("rejects workbooks beyond configured capacity before serialization", () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Data").addRows([
      ["A", "B"],
      ["C", "D"],
    ]);

    expect(() =>
      assertWorkbookWithinLimits(workbook, {
        maxWorksheets: 1,
        maxRows: 1,
        maxCells: 10,
      }),
    ).toThrow(ExportCapacityError);
  });

  it("limits simultaneous export work and drains queued operations", async () => {
    const gate = new ExportConcurrencyGate(1, 2, 5_000);
    const hold = deferred();
    const order: string[] = [];

    const first = gate.run(async () => {
      order.push("first-start");
      await hold.promise;
      order.push("first-end");
    });
    await Promise.resolve();

    const second = gate.run(async () => {
      order.push("second-start");
      order.push("second-end");
    });
    await Promise.resolve();

    expect(gate.snapshot()).toEqual({ active: 1, queued: 1 });
    hold.resolve();
    await Promise.all([first, second]);

    expect(order).toEqual(["first-start", "first-end", "second-start", "second-end"]);
    expect(gate.snapshot()).toEqual({ active: 0, queued: 0 });
  });

  it("refuses excess queued exports", async () => {
    const gate = new ExportConcurrencyGate(1, 0, 5_000);
    const hold = deferred();
    const first = gate.run(() => hold.promise);
    await Promise.resolve();

    await expect(gate.run(async () => undefined)).rejects.toMatchObject({
      code: "EXPORT_CAPACITY_EXCEEDED",
    });

    hold.resolve();
    await first;
  });

  it("serializes a valid workbook into a non-empty server buffer", async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.addWorksheet("Data").addRow(["Code", "Value"]);

    const buffer = await write(workbook);
    expect(buffer.byteLength).toBeGreaterThan(0);
  });
});
