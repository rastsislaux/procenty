import { Decimal, toDecimal } from "../math/decimal";
import { DayCountConvention, DayCountContext } from "../types";
import { daysInMonth, isLeapYear } from "../utils";

function pctToDecimal(pct: number): Decimal {
  return toDecimal(pct).div(100);
}

// 30E/360: Every month = 30 days, year = 360
export class ThirtyE360 implements DayCountConvention {
  readonly id = "30E_360";
  getPeriodicRate(nominalAnnualRatePercent: number, _monthIndex: number, ctx: DayCountContext): string {
    const periods = ctx.compoundingPerYear ?? 12;
    // For monthly schedules under 30E/360 this is equivalent to APR/12
    return pctToDecimal(nominalAnnualRatePercent).div(periods).toString();
  }
}

// Actual/365: Periodic rate prorated by actual days in month over 365
export class Actual365 implements DayCountConvention {
  readonly id = "Actual_365";
  getPeriodicRate(nominalAnnualRatePercent: number, monthIndex: number, ctx: DayCountContext): string {
    const apr = pctToDecimal(nominalAnnualRatePercent);
    if (ctx.startDate) {
      const start = new Date(ctx.startDate);
      const month0 = new Date(start.getFullYear(), start.getMonth() + (monthIndex - 1), 1);
      const dInMonth = daysInMonth(month0.getFullYear(), month0.getMonth());
      return apr.mul(dInMonth).div(365).toString();
    }
    // Fallback average month
    return apr.div(12).toString();
  }
}

// Actual/Actual (ISDA-like simplification)
export class ActualActual implements DayCountConvention {
  readonly id = "Actual_Actual";
  getPeriodicRate(nominalAnnualRatePercent: number, monthIndex: number, ctx: DayCountContext): string {
    const apr = pctToDecimal(nominalAnnualRatePercent);
    if (ctx.startDate) {
      const start = new Date(ctx.startDate);
      const month0 = new Date(start.getFullYear(), start.getMonth() + (monthIndex - 1), 1);
      const dInMonth = daysInMonth(month0.getFullYear(), month0.getMonth());
      const yearDays = isLeapYear(month0.getFullYear()) ? 366 : 365;
      return apr.mul(dInMonth).div(yearDays).toString();
    }
    // Fallback average
    return apr.div(12).toString();
  }
}

export const DayCounts = {
  ThirtyE360: new ThirtyE360(),
  Actual365: new Actual365(),
  ActualActual: new ActualActual()
};

