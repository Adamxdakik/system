import { z } from "zod";

// Bounds chosen to catch fat-finger errors but allow a wide range:
// - per-unit rate: 0.01 (1 cent) to 1000 (₨1000/unit)
// - percentage:    0.01 to 100
// String input (decimal) is parsed and re-validated as a number.

// Strict numeric parser: rejects "1abc", "", " ", "NaN", "Infinity", etc.
// Only accepts a sign-optional decimal literal in full-string match form.
const STRICT_DECIMAL = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/;
const decimalString = (min: number, max: number, label: string) =>
  z.union([z.string(), z.number()]).transform((v, ctx) => {
    let n: number;
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (!STRICT_DECIMAL.test(trimmed)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be a valid decimal number` });
        return z.NEVER;
      }
      n = Number(trimmed);
    } else {
      n = v;
    }
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be a number` });
      return z.NEVER;
    }
    if (n < min || n > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} must be between ${min} and ${max} (got ${n})`,
      });
      return z.NEVER;
    }
    return n.toFixed(4);
  });

export const motoRateRowSchema = z.object({
  locationId: z.coerce.number().int().positive(),
  rate: decimalString(0.01, 1000, "rate"),
  sourceCompanyId: z.coerce.number().int().positive().nullable().optional(),
});

export const motoPctRateRowSchema = z.object({
  locationId: z.coerce.number().int().positive(),
  pct: decimalString(0.01, 100, "pct"),
  sourceCompanyId: z.coerce.number().int().positive().nullable().optional(),
});

export const motoRatesPutSchema = z.object({
  rates: z.array(motoRateRowSchema).max(500),
});

export const motoPctRatesPutSchema = z.object({
  rates: z.array(motoPctRateRowSchema).max(500),
});

export const bulkSetMotoRateSchema = z.object({
  rate: decimalString(0.01, 1000, "rate"),
  employeeIds: z.array(z.coerce.number().int().positive()).min(1).max(500),
  sourceCompanyId: z.coerce.number().int().positive().nullable().optional(),
});

export const bulkSetMotoPctRateSchema = z.object({
  pct: decimalString(0.01, 100, "pct"),
  employeeIds: z.array(z.coerce.number().int().positive()).min(1).max(500),
  sourceCompanyId: z.coerce.number().int().positive().nullable().optional(),
});

export type MotoRateRow = z.infer<typeof motoRateRowSchema>;
export type MotoPctRateRow = z.infer<typeof motoPctRateRowSchema>;
export type MotoRatesPut = z.infer<typeof motoRatesPutSchema>;
export type MotoPctRatesPut = z.infer<typeof motoPctRatesPutSchema>;
export type BulkSetMotoRate = z.infer<typeof bulkSetMotoRateSchema>;
export type BulkSetMotoPctRate = z.infer<typeof bulkSetMotoPctRateSchema>;

// C1: rate templates
export const rateTemplateItemSchema = z.object({
  locationId: z.coerce.number().int().positive(),
  rate: decimalString(0.01, 1000, "rate").optional(),
  pct: decimalString(0.01, 100, "pct").optional(),
  sourceCompanyId: z.coerce.number().int().positive().nullable().optional(),
}).refine((v) => v.rate != null || v.pct != null, { message: "rate or pct required" });

export const rateTemplateCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  items: z.array(rateTemplateItemSchema).min(1).max(500),
});
export type RateTemplateCreate = z.infer<typeof rateTemplateCreateSchema>;

export const rateTemplateApplySchema = z.object({
  employeeIds: z.array(z.coerce.number().int().positive()).min(1).max(500),
});
export type RateTemplateApply = z.infer<typeof rateTemplateApplySchema>;
