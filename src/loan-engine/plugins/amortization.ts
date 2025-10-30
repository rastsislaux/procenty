import { Decimal, ONE, ZERO, pow1p, toDecimal } from "../math/decimal";
import { AmortizationContext, AmortizationStrategy } from "../types";

export class AnnuityStrategy implements AmortizationStrategy {
  readonly id = "Annuity";
  computeInstallment(remainingPrincipal: string, ctx: AmortizationContext): string {
    const P = toDecimal(remainingPrincipal);
    const r = toDecimal(ctx.periodicRate);
    const n = ctx.remainingMonths;
    if (n <= 0) return ZERO.toString();
    if (r.equals(0)) {
      return P.div(n).toString();
    }
    const factor = pow1p(r, n);
    const a = P.mul(r).mul(factor).div(factor.minus(ONE));
    return a.toString();
  }
  computePrincipalPortion(installment: string, periodicRate: string, remainingPrincipal: string): string {
    const A = toDecimal(installment);
    const r = toDecimal(periodicRate);
    const interest = toDecimal(remainingPrincipal).mul(r);
    return A.minus(interest).toString();
  }
}

export class DifferentiatedStrategy implements AmortizationStrategy {
  readonly id = "Differentiated";
  computeInstallment(remainingPrincipal: string, ctx: AmortizationContext): string {
    const principalPortion = this.principalPortion(remainingPrincipal, ctx.remainingMonths);
    const interest = toDecimal(remainingPrincipal).mul(toDecimal(ctx.periodicRate));
    return principalPortion.plus(interest).toString();
  }
  computePrincipalPortion(_installment: string, _periodicRate: string, remainingPrincipal: string): string {
    return this.principalPortion(remainingPrincipal, _installment ? 1 : 1).toString();
  }
  private principalPortion(remainingPrincipal: string, remainingMonths: number): Decimal {
    if (remainingMonths <= 0) return ZERO;
    return toDecimal(remainingPrincipal).div(remainingMonths);
  }
}

export const Amortizations = {
  Annuity: new AnnuityStrategy(),
  Differentiated: new DifferentiatedStrategy()
};

