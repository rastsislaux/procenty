import { Decimal, toDecimal } from "./decimal";
import { DayCountConvention, DayCountContext } from "../types";

export function periodicRate(
  dayCount: DayCountConvention,
  nominalAnnualRatePercent: number,
  monthIndex: number,
  ctx: DayCountContext
): Decimal {
  return toDecimal(dayCount.getPeriodicRate(nominalAnnualRatePercent, monthIndex, ctx));
}

