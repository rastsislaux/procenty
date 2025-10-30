import Decimal from "decimal.js-light";

// Configure a sensible precision for financial calcs
Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

export { Decimal };

export function toDecimal(value: string | number | Decimal): Decimal {
  return value instanceof Decimal ? value : new Decimal(value as any);
}

export function formatMoney(value: Decimal, scale: number): string {
  return value.toFixed(scale, Decimal.ROUND_HALF_UP);
}

export const ZERO = new Decimal(0);
export const ONE = new Decimal(1);

export function min(a: Decimal, b: Decimal): Decimal {
  return a.lessThan(b) ? a : b;
}

export function max(a: Decimal, b: Decimal): Decimal {
  return a.greaterThan(b) ? a : b;
}

export function pow1p(rate: Decimal, n: number): Decimal {
  // (1 + rate) ^ n
  return ONE.plus(rate).pow(n);
}

