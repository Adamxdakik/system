import type ExcelJS from "exceljs";

export interface WorkbookMetrics {
  worksheets: number;
  rows: number;
  cells: number;
}

export interface WorkbookLimits {
  maxWorksheets: number;
  maxRows: number;
  maxCells: number;
}

const DEFAULT_LIMITS: WorkbookLimits = {
  maxWorksheets: 50,
  maxRows: 250_000,
  maxCells: 3_000_000,
};

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function configuredWorkbookLimits(): WorkbookLimits {
  return {
    maxWorksheets: positiveInteger(
      process.env.EXPORT_MAX_WORKSHEETS,
      DEFAULT_LIMITS.maxWorksheets,
    ),
    maxRows: positiveInteger(process.env.EXPORT_MAX_ROWS, DEFAULT_LIMITS.maxRows),
    maxCells: positiveInteger(process.env.EXPORT_MAX_CELLS, DEFAULT_LIMITS.maxCells),
  };
}

export function workbookMetrics(workbook: ExcelJS.Workbook): WorkbookMetrics {
  let rows = 0;
  let cells = 0;

  for (const worksheet of workbook.worksheets) {
    rows += worksheet.actualRowCount;
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      cells += row.actualCellCount;
    });
  }

  return {
    worksheets: workbook.worksheets.length,
    rows,
    cells,
  };
}

export class ExportCapacityError extends Error {
  readonly code = "EXPORT_CAPACITY_EXCEEDED";

  constructor(message: string) {
    super(message);
    this.name = "ExportCapacityError";
  }
}

export function assertWorkbookWithinLimits(
  workbook: ExcelJS.Workbook,
  limits: WorkbookLimits = configuredWorkbookLimits(),
): WorkbookMetrics {
  const metrics = workbookMetrics(workbook);

  if (metrics.worksheets > limits.maxWorksheets) {
    throw new ExportCapacityError(
      `Export contains ${metrics.worksheets} worksheets; the configured limit is ${limits.maxWorksheets}. Narrow the export and try again.`,
    );
  }
  if (metrics.rows > limits.maxRows) {
    throw new ExportCapacityError(
      `Export contains ${metrics.rows} rows; the configured limit is ${limits.maxRows}. Narrow the date range or filters and try again.`,
    );
  }
  if (metrics.cells > limits.maxCells) {
    throw new ExportCapacityError(
      `Export contains ${metrics.cells} populated cells; the configured limit is ${limits.maxCells}. Narrow the date range or filters and try again.`,
    );
  }

  return metrics;
}

interface Waiter {
  resolve: () => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

export class ExportConcurrencyGate {
  private active = 0;
  private readonly waiters: Waiter[] = [];

  constructor(
    private readonly maximumActive: number,
    private readonly maximumQueued: number,
    private readonly waitTimeoutMs: number,
  ) {}

  private async acquire(): Promise<void> {
    if (this.active < this.maximumActive) {
      this.active += 1;
      return;
    }

    if (this.waiters.length >= this.maximumQueued) {
      throw new ExportCapacityError(
        "Too many exports are already being generated. Try again after the current exports finish.",
      );
    }

    await new Promise<void>((resolve, reject) => {
      const waiter: Waiter = {
        resolve: () => {
          clearTimeout(waiter.timer);
          this.active += 1;
          resolve();
        },
        reject,
        timer: setTimeout(() => {
          const index = this.waiters.indexOf(waiter);
          if (index >= 0) this.waiters.splice(index, 1);
          reject(
            new ExportCapacityError(
              "Export generation did not start before the safety timeout. Try again.",
            ),
          );
        }, this.waitTimeoutMs),
      };
      this.waiters.push(waiter);
    });
  }

  private release(): void {
    this.active = Math.max(0, this.active - 1);
    const next = this.waiters.shift();
    if (next) next.resolve();
  }

  async run<T>(operation: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await operation();
    } finally {
      this.release();
    }
  }

  snapshot(): { active: number; queued: number } {
    return { active: this.active, queued: this.waiters.length };
  }
}

export function configuredExportConcurrencyGate(): ExportConcurrencyGate {
  return new ExportConcurrencyGate(
    positiveInteger(process.env.EXPORT_MAX_CONCURRENT, 2),
    positiveInteger(process.env.EXPORT_MAX_QUEUE, 8),
    positiveInteger(process.env.EXPORT_QUEUE_TIMEOUT_MS, 30_000),
  );
}
