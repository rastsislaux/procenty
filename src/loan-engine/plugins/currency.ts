import { Currency } from "../types";
import { Decimal, formatMoney, toDecimal } from "../math/decimal";

class BasicCurrency implements Currency {
  readonly code: string;
  readonly scale: number;
  constructor(code: string, scale: number) {
    this.code = code;
    this.scale = scale;
  }
  round(amount: string): string {
    return formatMoney(toDecimal(amount), this.scale);
  }
}

export const Currencies = {
  USD: new BasicCurrency("USD", 2),
  EUR: new BasicCurrency("EUR", 2),
  BYN: new BasicCurrency("BYN", 2),
  GBP: new BasicCurrency("GBP", 2)
};

