export type DecimalInput = string | number | bigint;

const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/;

export class MoneyValidationError extends Error {
  readonly status = 422;
  readonly code = "INVALID_MONEY";

  constructor(message: string) {
    super(message);
    this.name = "MoneyValidationError";
  }
}

export function decimalToScaledInteger(value: DecimalInput, scale: number): bigint {
  if (!Number.isInteger(scale) || scale < 0) {
    throw new MoneyValidationError("Decimal scale must be a non-negative integer");
  }

  const normalized = String(value).trim();
  const match = DECIMAL_PATTERN.exec(normalized);
  if (!match) {
    throw new MoneyValidationError("Amount must be a finite decimal value");
  }

  const [, sign, whole, fraction = ""] = match;
  if (fraction.length > scale && /[1-9]/.test(fraction.slice(scale))) {
    throw new MoneyValidationError(`Amount exceeds the supported ${scale}-decimal precision`);
  }

  const factor = 10n ** BigInt(scale);
  const scaled =
    BigInt(whole) * factor + BigInt(fraction.slice(0, scale).padEnd(scale, "0") || "0");
  return sign === "-" ? -scaled : scaled;
}

export function scaledIntegerToDecimal(value: bigint, scale: number): string {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const factor = 10n ** BigInt(scale);
  const whole = absolute / factor;
  if (scale === 0) return `${negative ? "-" : ""}${whole}`;
  const fraction = (absolute % factor).toString().padStart(scale, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

export function normalizeMoney(value: DecimalInput): string {
  return scaledIntegerToDecimal(decimalToScaledInteger(value, 2), 2);
}

export function normalizeExchangeRate(value: DecimalInput): string {
  const scaled = decimalToScaledInteger(value, 8);
  if (scaled <= 0n) {
    throw new MoneyValidationError("Exchange rate must be greater than zero");
  }
  return scaledIntegerToDecimal(scaled, 8);
}

export function addMoney(values: DecimalInput[]): string {
  const total = values.reduce<bigint>((sum, value) => sum + decimalToScaledInteger(value, 2), 0n);
  return scaledIntegerToDecimal(total, 2);
}

export function convertForeignToBase(
  foreignAmount: DecimalInput,
  exchangeRate: DecimalInput,
): string {
  const foreignMinor = decimalToScaledInteger(foreignAmount, 2);
  const rateScaled = decimalToScaledInteger(exchangeRate, 8);
  if (rateScaled <= 0n) {
    throw new MoneyValidationError("Exchange rate must be greater than zero");
  }

  const divisor = 10n ** 8n;
  const product = foreignMinor * rateScaled;
  const absolute = product < 0n ? -product : product;
  const rounded = (absolute + divisor / 2n) / divisor;
  return scaledIntegerToDecimal(product < 0n ? -rounded : rounded, 2);
}
