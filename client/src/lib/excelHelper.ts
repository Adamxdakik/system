import ExcelJS from "exceljs";

// Drop-in compatible subset of the SheetJS (xlsx) API, backed by exceljs.
// Designed to minimize call-site changes when migrating off `xlsx` (which
// has unfixable prototype-pollution + ReDoS CVEs). All read/write operations
// are async since exceljs is async-first.

export type SheetData =
  | { kind: "json"; data: Record<string, any>[]; headers: string[] }
  | { kind: "aoa"; aoa: any[][] };

export interface ExcelRange {
  s: { r: number; c: number };
  e: { r: number; c: number };
}

export interface CompatWorkbook {
  workbook: ExcelJS.Workbook;
  SheetNames: string[];
  Sheets: Record<string, ExcelJS.Worksheet>;
}

interface WorkbookMetrics {
  worksheets: number;
  rows: number;
  cells: number;
}

const CLIENT_EXPORT_LIMITS = {
  maxWorksheets: 50,
  maxRows: 250_000,
  maxCells: 3_000_000,
};

let activeDownload: Promise<void> | null = null;

export const utils = {
  book_new: (): ExcelJS.Workbook => new ExcelJS.Workbook(),

  json_to_sheet: (data: Record<string, any>[]): SheetData => {
    if (data.length === 0) return { kind: "json", data: [], headers: [] };
    return { kind: "json", data, headers: Object.keys(data[0]) };
  },

  aoa_to_sheet: (data: any[][]): SheetData => ({ kind: "aoa", aoa: data }),

  decode_range: (range: string): ExcelRange => {
    const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
    if (!match) return { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
    const colToNum = (col: string) => {
      let num = 0;
      for (let index = 0; index < col.length; index++) {
        num = num * 26 + col.charCodeAt(index) - 64;
      }
      return num - 1;
    };
    return {
      s: { r: parseInt(match[2], 10) - 1, c: colToNum(match[1]) },
      e: { r: parseInt(match[4], 10) - 1, c: colToNum(match[3]) },
    };
  },

  encode_cell: (cell: { r: number; c: number }): string => {
    const numToCol = (num: number): string => {
      let col = "";
      num++;
      while (num > 0) {
        num--;
        col = String.fromCharCode(65 + (num % 26)) + col;
        num = Math.floor(num / 26);
      }
      return col;
    };
    return numToCol(cell.c) + (cell.r + 1);
  },

  book_append_sheet: (
    workbook: ExcelJS.Workbook,
    sheetData: SheetData & { "!cols"?: { wch?: number }[] },
    name: string,
  ): ExcelJS.Worksheet => {
    const worksheet = workbook.addWorksheet(name);
    if (sheetData.kind === "aoa") {
      for (const row of sheetData.aoa) worksheet.addRow(row);
    } else {
      worksheet.addRow(sheetData.headers);
      for (const item of sheetData.data) {
        worksheet.addRow(sheetData.headers.map((header) => item[header] ?? ""));
      }
    }
    if (sheetData["!cols"]) {
      sheetData["!cols"].forEach((column, index) => {
        if (column?.wch && worksheet.columns[index]) {
          worksheet.getColumn(index + 1).width = column.wch;
        }
      });
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

function workbookMetrics(workbook: ExcelJS.Workbook): WorkbookMetrics {
  let rows = 0;
  let cells = 0;

  for (const worksheet of workbook.worksheets) {
    rows += worksheet.actualRowCount;
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      cells += row.actualCellCount;
    });
  }

  return { worksheets: workbook.worksheets.length, rows, cells };
}

function assertClientWorkbookWithinLimits(workbook: ExcelJS.Workbook): void {
  const metrics = workbookMetrics(workbook);

  if (metrics.worksheets > CLIENT_EXPORT_LIMITS.maxWorksheets) {
    throw new Error(
      `This export contains ${metrics.worksheets} worksheets. Narrow the export and try again.`,
    );
  }
  if (metrics.rows > CLIENT_EXPORT_LIMITS.maxRows) {
    throw new Error(
      `This export contains ${metrics.rows} rows. Narrow the date range or filters and try again.`,
    );
  }
  if (metrics.cells > CLIENT_EXPORT_LIMITS.maxCells) {
    throw new Error(
      `This export contains ${metrics.cells} populated cells. Narrow the date range or filters and try again.`,
    );
  }
}

async function serializeWorkbook(workbook: ExcelJS.Workbook): Promise<ArrayBuffer> {
  assertClientWorkbookWithinLimits(workbook);
  const serialized = await workbook.xlsx.writeBuffer();
  if (serialized.byteLength === 0) {
    throw new Error("Excel export produced an empty file");
  }
  return serialized;
}

export async function writeFile(workbook: ExcelJS.Workbook, filename: string): Promise<void> {
  if (activeDownload) {
    throw new Error(
      "Another Excel export is already being generated. Try again after it finishes.",
    );
  }

  const operation = (async () => {
    const buffer = await serializeWorkbook(workbook);
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    if (blob.size === 0) throw new Error("Excel export produced an empty file");

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    try {
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
    } finally {
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }
  })();

  activeDownload = operation;
  try {
    await operation;
  } finally {
    if (activeDownload === operation) activeDownload = null;
  }
}

export async function write(
  workbook: ExcelJS.Workbook,
  _options?: { type?: "buffer" | "array"; bookType?: "xlsx" },
): Promise<Uint8Array> {
  const buffer = await serializeWorkbook(workbook);
  return new Uint8Array(buffer);
}

export async function read(
  data: ArrayBuffer | Uint8Array | File,
  _options?: { type?: "buffer" | "array" | "binary" },
): Promise<CompatWorkbook> {
  const workbook = new ExcelJS.Workbook();
  if (data instanceof File) {
    await workbook.xlsx.load(await data.arrayBuffer());
  } else if (data instanceof ArrayBuffer) {
    await workbook.xlsx.load(data);
  } else {
    await workbook.xlsx.load(
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer,
    );
  }
  const SheetNames: string[] = [];
  const Sheets: Record<string, ExcelJS.Worksheet> = {};
  workbook.eachSheet((worksheet) => {
    SheetNames.push(worksheet.name);
    Sheets[worksheet.name] = worksheet;
  });
  return { workbook, SheetNames, Sheets };
}

export async function readFile(file: File): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  return workbook;
}

export async function readFromBuffer(data: ArrayBuffer | Uint8Array): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    data instanceof ArrayBuffer
      ? data
      : (data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer),
  );
  return workbook;
}

export interface WorkbookData extends CompatWorkbook {}

const XLSX = { utils, read, write, writeFile };
export default XLSX;
export { ExcelJS };
