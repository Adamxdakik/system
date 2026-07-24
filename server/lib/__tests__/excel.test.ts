import { describe, it, expect } from "vitest";
import * as XLSX from "../excel";

describe("excel shim (exceljs-backed)", () => {
  it("round-trips JSON rows: json_to_sheet -> write -> read -> sheet_to_json", async () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      { name: "Alice", qty: 10, price: 99.5 },
      { name: "Bob", qty: 3, price: 12.25 },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Items");

    const buf = await XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
    // PK = ZIP file magic = real .xlsx
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);

    const wb2 = await XLSX.read(buf, { type: "buffer" });
    expect(wb2.SheetNames).toContain("Items");
    const ws2 = wb2.Sheets["Items"];
    const rows2 = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws2);
    expect(rows2).toEqual(rows);
  });

  it("supports aoa_to_sheet (array-of-arrays input)", async () => {
    const wb = XLSX.utils.book_new();
    const aoa = [
      ["Name", "Qty"],
      ["Apple", 5],
      ["Pear", 8],
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    const buf = await XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const wb2 = await XLSX.read(buf, { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb2.Sheets["Sheet1"]);
    expect(rows).toEqual([
      { Name: "Apple", Qty: 5 },
      { Name: "Pear", Qty: 8 },
    ]);
  });

  it("preserves multiple sheets", async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ a: 1 }]), "First");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{ b: 2 }]), "Second");
    const buf = await XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const wb2 = await XLSX.read(buf, { type: "buffer" });
    expect(wb2.SheetNames).toEqual(["First", "Second"]);
  });

  it.each([
    [
      "PO",
      {
        "Item Name": "Brake Pad",
        Barcode: "PO-001",
        Quantity: 4,
        Rate: 12.5,
        "Charge Type": "Freight",
      },
    ],
    ["POS", { Barcode: "POS-001", Quantity: 2, Rate: 25 }],
    ["stock transfer", { Barcode: "ST-001", Quantity: 3 }],
    ["multi-source stock transfer", { "Source Location": "WH-1", Barcode: "STM-001", Quantity: 1 }],
  ])("parses a representative %s XLSX fixture", async (_name, fixture) => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([fixture]), "Import");
    const buffer = await XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });
    const parsed = await XLSX.read(buffer, { type: "buffer" });

    expect(XLSX.utils.sheet_to_json(parsed.Sheets[parsed.SheetNames[0]])).toEqual([fixture]);
  });
});
