import { Decimal, ONE, ZERO, formatMoney, toDecimal, min, max } from "../math/decimal";
import {
  AmortizationStrategy,
  DayCountContext,
  GracePeriodStrategy,
  LoanConfig,
  LoanResult,
  ScheduleRow
} from "../types";
import { periodicRate } from "../math/rate";
import { toDate } from "../utils";
import { PrepaymentPolicies, computeExtraFromEvent, expandPrepaymentEvents } from "../plugins/prepayment";

export function computeLoan(config: LoanConfig): LoanResult {
  const currency = config.currency;
  const scale = currency.scale;
  const compPerYear = config.compoundingPerYear ?? 12;
  const startDate = toDate(config.startDate);
  const dayCtx: DayCountContext = { compoundingPerYear: compPerYear, startDate };
  const grace: GracePeriodStrategy | null | undefined = config.grace;
  const amortization: AmortizationStrategy = config.amortization;
  const prepayPolicy = config.prepaymentPolicy ?? PrepaymentPolicies.ReduceTerm;
  const prepaymentMap = expandPrepaymentEvents(config.prepayments, config.termMonths);

  let remaining = toDecimal(config.principal);
  const schedule: ScheduleRow[] = [];
  let minInstallment: Decimal | undefined;
  let maxInstallment: Decimal | undefined;

  // First payment handling (executed at month 1 before normal installment)
  let firstPaymentExtra = ZERO;
  if (config.firstPayment) {
    if (config.firstPayment.type === "Absolute") {
      firstPaymentExtra = toDecimal(config.firstPayment.value);
    } else if (config.firstPayment.type === "Percent") {
      firstPaymentExtra = remaining.mul(toDecimal(config.firstPayment.value).div(100));
    }
  }

  const epsilon = new Decimal("0.00000001");

  for (let month = 1; month <= config.termMonths; month++) {
    // Apply first payment once at month 1 before computing installment
    const notes: string[] = [];
    if (month === 1 && firstPaymentExtra.greaterThan(0)) {
      remaining = max(ZERO, remaining.minus(firstPaymentExtra));
      notes.push("firstPayment");
    }

    // Determine annual rate override during grace, if any
    let nominalAnnualRate = config.nominalAnnualRatePercent;
    if (grace && month <= grace.months && typeof grace.overridePeriodicRate === "function") {
      const maybe = grace.overridePeriodicRate(config.nominalAnnualRatePercent, month);
      if (typeof maybe === "number") nominalAnnualRate = maybe;
    }

    const r = periodicRate(config.dayCount, nominalAnnualRate, month, dayCtx);

    // Prepayment extra calculation for this month (needs base installment for percent mode)
    // We'll compute base installment lazily below.

    // Check grace override for installment
    let installment: Decimal;
    let interestPortion: Decimal;
    let principalPortion: Decimal;

    const inGrace = grace && month <= grace.months && typeof grace.overrideInstallment === "function";
    if (inGrace) {
      const override = grace!.overrideInstallment!({
        monthIndex: month,
        periodicRate: r.toString(),
        remainingPrincipal: remaining.toString()
      });
      if (!override) throw new Error("Grace strategy overrideInstallment must return a value when provided");
      installment = toDecimal(override.installment);
      interestPortion = toDecimal(override.interest);
      principalPortion = toDecimal(override.principal);
      notes.push("grace");
    } else {
      const remainingMonths = config.termMonths - month + 1;
      const baseInstallment = toDecimal(
        amortization.computeInstallment(remaining.toString(), {
          monthIndex: month,
          periodicRate: r.toString(),
          remainingMonths
        })
      );

      // Now evaluate any prepayment events that reference base installment percent
      let extraPrepay = ZERO;
      const events = prepaymentMap.get(month) ?? [];
      for (const ev of events) {
        const extra = toDecimal(
          computeExtraFromEvent(ev, baseInstallment.toString(), remaining.toString())
        );
        if (extra.greaterThan(0)) extraPrepay = extraPrepay.plus(extra);
      }

      // Regular amortization breakdown
      const interest = remaining.mul(r);
      let principal = max(ZERO, baseInstallment.minus(interest));

      // Cannot pay more principal than outstanding
      principal = min(principal, remaining);

      // Apply to remaining
      remaining = remaining.minus(principal);

      // Apply prepayment via policy
      if (extraPrepay.greaterThan(0)) {
        const polRes = prepayPolicy.apply(extraPrepay.toString(), {
          monthIndex: month,
          installment: baseInstallment.toString(),
          periodicRate: r.toString(),
          remainingPrincipal: remaining.toString(),
          remainingMonths
        });
        remaining = toDecimal(polRes.newRemainingPrincipal);
        notes.push("prepayment");
      }

      // Installment should include base installment plus any prepayment
      // For the last payment (when remaining is near zero), use actual interest + principal + prepayment
      if (remaining.lessThan(epsilon)) {
        installment = interest.plus(principal).plus(extraPrepay);
      } else {
        installment = baseInstallment.plus(extraPrepay);
      }
      interestPortion = interest;
      // Principal portion should include the prepayment amount as well
      principalPortion = principal.plus(extraPrepay);
    }

    // Clamp last payment to clear remainder
    if (remaining.lessThan(epsilon) && month < config.termMonths) {
      remaining = ZERO;
    }

    // Track min/max installments for metadata
    minInstallment = minInstallment ? min(minInstallment, installment) : installment;
    maxInstallment = maxInstallment ? max(maxInstallment, installment) : installment;

    // Push schedule row (rounded for display)
    schedule.push({
      monthIndex: month,
      installment: currency.round(installment.toString()),
      interestPortion: currency.round(interestPortion.toString()),
      principalPortion: currency.round(principalPortion.toString()),
      remainingPrincipal: currency.round(remaining.toString()),
      periodicRate: r.toString(),
      notes: notes.length ? notes : undefined
    });

    if (remaining.lessThanOrEqualTo(epsilon)) {
      break;
    }
  }

  // Aggregates
  let totalPaid = ZERO;
  let totalInterest = ZERO;
  for (const row of schedule) {
    totalPaid = totalPaid.plus(toDecimal(row.installment));
    totalInterest = totalInterest.plus(toDecimal(row.interestPortion));
  }

  const meta = {
    totalPaid: currency.round(totalPaid.toString()),
    totalInterest: currency.round(totalInterest.toString()),
    maxInstallment: currency.round((maxInstallment ?? ZERO).toString()),
    minInstallment: currency.round((minInstallment ?? ZERO).toString()),
    payoffMonth: schedule.length
  };

  return {
    id: config.id,
    currency: currency.code,
    schedule,
    meta
  };
}

