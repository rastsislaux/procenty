import { Decimal, toDecimal } from "../math/decimal";
import { GraceContext, GracePeriodStrategy } from "../types";

export class InterestOnlyGrace implements GracePeriodStrategy {
  readonly id = "InterestOnly";
  readonly months: number;
  constructor(months: number) {
    this.months = months;
  }
  overrideInstallment(ctx: GraceContext) {
    const interest = toDecimal(ctx.remainingPrincipal).mul(toDecimal(ctx.periodicRate));
    return { installment: interest.toString(), interest: interest.toString(), principal: "0" };
  }
}

export class ReducedRateGrace implements GracePeriodStrategy {
  readonly id = "ReducedRate";
  readonly months: number;
  private readonly reducedAnnualRatePercent: number;
  constructor(months: number, reducedAnnualRatePercent: number) {
    this.months = months;
    this.reducedAnnualRatePercent = reducedAnnualRatePercent;
  }
  overridePeriodicRate(_nominalAnnualRatePercent: number, _monthIndex: number): number | undefined {
    return this.reducedAnnualRatePercent;
  }
}

export const GracePeriods = {
  InterestOnly: (months: number) => new InterestOnlyGrace(months),
  ReducedRate: (months: number, reducedAnnualRatePercent: number) =>
    new ReducedRateGrace(months, reducedAnnualRatePercent)
};

