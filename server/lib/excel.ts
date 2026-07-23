import ExcelJS from "exceljs";

// Drop-in compatible subset of the SheetJS (xlsx) API, backed by exceljs.
// Designed to minimize call-site changes when migrating off `xlsx` (which
// has unfixable prototype-pollution + ReDoS CVEs). All read/write operations
// are async since exceljs is async-first.

export type SheetData =
  | { kind: "json"; data: Record<string, any>[]; headers: string[] }
  | { kind: "aoa"; aoa: any[][] };

export interface CompatWorkbook {
  workbook: ExcelJS.Workbook;
  SheetNames: string[];
  Sheets: Record<string, ExcelJS.Worksheet>;
}

export const utils = {
  book_new: (): ExcelJS.Workbook => new ExcelJS.Workbook(),

  json_to_sheet: (data: Record<string, any>[]): SheetData => {
    if (data.length === 0) return { kind: "json", data: [], headers: [] };
    return { kind: "json", data, headers: Object.keys(data[0]) };
  },

  aoa_to_sheet: (data: any[][]): SheetData => ({ kind: "aoa", aoa: data }),

  book_append_sheet: (
    workbook: ExcelJS.Workbook,
    sheetData: SheetData,
    name: string,
  ): ExcelJS.Worksheet => {
    const worksheet = workbook.addWorksheet(name);
    if (sheetData.kind === "aoa") {
      for (const row of sheetData.aoa) worksheet.addRow(row);
    } else {
      worksheet.addRow(sheetData.headers);
      for (const item of sheetData.data) {
        worksheet.addRow(sheetData.headers.map((h) => item[h] ?? ""));
      }
    }
    return worksheet;
  },

  sheet_to_json: <T = Record<string, any>>(
    worksheet: ExcelJS.Worksheet,
    options?: { header?: number | string },
  ): T[] => {
    const out: any[] = [];
    if (options?.header === 1) {
      worksheet.eachRow((row) => {
        const arr: any[] = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          arr[colNumber - 1] = unwrapCell(cell.value);
        });
        out.push(arr);
      });
      return out as T[];
    }

    const headers: string[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber - 1] = String(unwrapCell(cell.value) ?? "");
        });
      } else {
        const obj: Record<string, any> = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) obj[header] = unwrapCell(cell.value);
        });
        if (Object.keys(obj).length > 0) out.push(obj);
      }
    });
    return out as T[];
  },
};

function unwrapCell(value: ExcelJS.CellValue): unknown {
  if (value && typeof value === "object") {
    if ("result" in value) return (value as { result: unknown }).result;
    if ("text" in value) return (value as { text: unknown }).text;
  }
  return value;
}

export async function read(
  data: Buffer | ArrayBuffer | Uint8Array,
  _options?: { type?: "buffer" | "array" | "binary" },
): Promise<CompatWorkbook> {
  const workbook = new ExcelJS.Workbook();
  let buffer: ArrayBuffer;
  if (data instanceof ArrayBuffer) {
    buffer = data;
  } else {
    // Buffer and Uint8Array both expose .buffer/.byteOffset/.byteLength
    const view = data as Uint8Array;
    buffer = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
  }
  await workbook.xlsx.load(buffer);

  const SheetNames: string[] = [];
  const Sheets: Record<string, ExcelJS.Worksheet> = {};
  workbook.eachSheet((ws) => {
    SheetNames.push(ws.name);
    Sheets[ws.name] = ws;
  });
  return { workbook, SheetNames, Sheets };
}

export async function write(
  workbook: ExcelJS.Workbook,
  _options?: { type?: "buffer"; bookType?: "xlsx" },
): Promise<Buffer> {
  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

const XLSX = { utils, read, write };
export default XLSX;
