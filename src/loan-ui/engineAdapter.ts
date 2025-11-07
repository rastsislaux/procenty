import { Amortizations, Currencies, DayCounts, GracePeriods, PrepaymentPolicies, LoanConfig, FirstPaymentConfig, PrepaymentEvent } from '../loan-engine';
import { Template } from '../config/loan-templates';

export type UserInputs = {
  principal: string;
  rate?: number;
  term?: number;
  firstPayment?: FirstPaymentConfig;
  prepayments?: PrepaymentEvent[];
  graceMonths?: number;
  graceReducedRatePercent?: number;
  inflationRate?: number;
};

function currencyFrom(code?: Template['currency']) {
  const map = Currencies as Record<string, any>;
  return map[code ?? 'USD'];
}

function dayCountFrom(id?: Template['dayCount']) {
  const byId: Record<string, any> = {
    '30E_360': DayCounts.ThirtyE360,
    'Actual_365': DayCounts.Actual365,
    'Actual_Actual': DayCounts.ActualActual,
  };
  return byId[id ?? '30E_360'];
}

function amortizationFrom(id?: Template['amortization']) {
  const byId: Record<string, any> = {
    'Annuity': Amortizations.Annuity,
    'Differentiated': Amortizations.Differentiated,
  };
  return byId[id ?? 'Annuity'];
}

export function templateToConfig(t: Template, u: UserInputs): LoanConfig {
  return {
    id: t.id,
    currency: currencyFrom(t.currency),
    principal: u.principal,
    nominalAnnualRatePercent: (u.rate ?? t.nominalAnnualRatePercent)!,
    termMonths: (u.term ?? t.termMonths)!,
    amortization: amortizationFrom(t.amortization),
    dayCount: dayCountFrom(t.dayCount),
    grace: t.grace
      ? t.grace.type === 'InterestOnly'
        ? GracePeriods.InterestOnly(u.graceMonths ?? t.grace.months)
        : GracePeriods.ReducedRate(
            u.graceMonths ?? t.grace.months,
            (u.graceReducedRatePercent ?? t.grace.reducedAnnualRatePercent ?? 0)
          )
      : null,
    prepaymentPolicy: t.prepaymentPolicy ? PrepaymentPolicies[t.prepaymentPolicy] : undefined,
    firstPayment: t.allowFirstPayment ? u.firstPayment : undefined,
    prepayments: t.prepaymentsAllowed ? u.prepayments : undefined,
    annualInflationRatePercent: u.inflationRate,
  };
}

export function convertUIEventsToEngine(uiEvents: any[]): PrepaymentEvent[] {
  return uiEvents.map((ev) => {
    const monthRange = ev.rangeType === 'single'
      ? { month: ev.month }
      : { start: ev.month, end: ev.endMonth ?? ev.month, ...(ev.step != null ? { step: ev.step } : {}) };
    const mode = ev.type === 'Amount'
      ? { type: 'Amount' as const, amount: String(ev.amount ?? 0) }
      : { type: 'ExtraInstallmentPercent' as const, percent: ev.percent ?? 0 };
    return {
      monthRange,
      mode,
      ...(ev.policy ? { policyOverride: ev.policy } : {}),
    };
  });
}

export function validateAgainstConstraints(
  t: Template,
  u: UserInputs,
  tFunc?: (key: string, params?: Record<string, string | number>) => string
): { ok: boolean; messages: string[] } {
  const msgs: string[] = [];
  const getErrorMsg = (key: string, params?: Record<string, string | number>) => {
    if (tFunc) {
      return tFunc(`errors.${key}`, params);
    }
    // Fallback to English
    const fallbacks: Record<string, string> = {
      principalRequired: 'Principal must be > 0',
      rateRequired: 'Rate is required for this template',
      termRequired: 'Term is required for this template',
      termMustBeOneOf: `Term must be one of: ${params?.values || ''}`,
      termMustBeAtLeast: `Term must be >= ${params?.min || ''}`,
      termMustBeAtMost: `Term must be <= ${params?.max || ''}`,
      rateMustBeOneOf: `Rate must be one of: ${params?.values || ''}`,
      rateMustBeAtLeast: `Rate must be >= ${params?.min || ''}`,
      rateMustBeAtMost: `Rate must be <= ${params?.max || ''}`,
      firstPaymentPercentMin: `First payment percent must be >= ${params?.min || ''}`,
      firstPaymentPercentMax: `First payment percent must be <= ${params?.max || ''}`,
      firstPaymentAbsoluteMin: `First payment must be >= ${params?.min || ''}`,
      firstPaymentAbsoluteMax: `First payment must be <= ${params?.max || ''}`,
      graceMonthsMustBeOneOf: `Grace months must be one of: ${params?.values || ''}`,
      graceMonthsAtLeast: `Grace months must be >= ${params?.min || ''}`,
      graceMonthsAtMost: `Grace months must be <= ${params?.max || ''}`,
      graceReducedRateMustBeOneOf: `Grace reduced rate must be one of: ${params?.values || ''}`,
      graceReducedRateAtLeast: `Grace reduced rate must be >= ${params?.min || ''}`,
      graceReducedRateAtMost: `Grace reduced rate must be <= ${params?.max || ''}`,
    };
    return fallbacks[key] || key;
  };

  if (!u.principal || Number(u.principal) <= 0) {
    msgs.push(getErrorMsg('principalRequired'));
  }
  // Require presence of missing rate/term
  const requiredRate = t.nominalAnnualRatePercent == null;
  if (requiredRate && (u.rate == null || isNaN(u.rate))) {
    msgs.push(getErrorMsg('rateRequired'));
  }
  const requiredTerm = t.termMonths == null;
  if (requiredTerm && (u.term == null || isNaN(u.term))) {
    msgs.push(getErrorMsg('termRequired'));
  }
  if (t.constraints?.termMonths && u.term != null) {
    const c = t.constraints.termMonths;
    if (c.type === 'enum' && !c.values.includes(u.term)) {
      msgs.push(getErrorMsg('termMustBeOneOf', { values: c.values.join(', ') }));
    }
    if (c.type === 'range') {
      if (c.min != null && u.term < c.min) {
        msgs.push(getErrorMsg('termMustBeAtLeast', { min: c.min }));
      }
      if (c.max != null && u.term > c.max) {
        msgs.push(getErrorMsg('termMustBeAtMost', { max: c.max }));
      }
    }
  }
  if (t.constraints?.nominalAnnualRatePercent) {
    const c = t.constraints.nominalAnnualRatePercent;
    const rate = u.rate ?? t.nominalAnnualRatePercent;
    if (rate != null) {
      if (c.type === 'enum' && !c.values.includes(rate)) {
        msgs.push(getErrorMsg('rateMustBeOneOf', { values: c.values.join(', ') }));
      }
      if (c.type === 'range') {
        if (c.min != null && rate < c.min) {
          msgs.push(getErrorMsg('rateMustBeAtLeast', { min: c.min }));
        }
        if (c.max != null && rate > c.max) {
          msgs.push(getErrorMsg('rateMustBeAtMost', { max: c.max }));
        }
      }
    }
  }
  // first payment constraints
  if (u.firstPayment && t.allowFirstPayment) {
    const principalNum = Number(u.principal);
    if (u.firstPayment.type === 'Percent') {
      const percentC = t.constraints?.firstPaymentPercent;
      if (percentC && percentC.type === 'range') {
        if (percentC.min != null && u.firstPayment.value < percentC.min) {
          msgs.push(getErrorMsg('firstPaymentPercentMin', { min: percentC.min }));
        }
        if (percentC.max != null && u.firstPayment.value > percentC.max) {
          msgs.push(getErrorMsg('firstPaymentPercentMax', { max: percentC.max }));
        }
      }
      // If only absolute constraints exist, validate percent against equivalent percent
      const absoluteC = t.constraints?.firstPaymentAbsolute;
      if (absoluteC && absoluteC.type === 'range' && isFinite(principalNum) && principalNum > 0) {
        if (absoluteC.min != null) {
          const minPercent = (absoluteC.min / principalNum) * 100;
          if (u.firstPayment.value < minPercent) {
            msgs.push(getErrorMsg('firstPaymentPercentMin', { min: Number(minPercent.toFixed(2)) }));
          }
        }
        if (absoluteC.max != null) {
          const maxPercent = (absoluteC.max / principalNum) * 100;
          if (u.firstPayment.value > maxPercent) {
            msgs.push(getErrorMsg('firstPaymentPercentMax', { max: Number(maxPercent.toFixed(2)) }));
          }
        }
      }
    } else {
      const absoluteC = t.constraints?.firstPaymentAbsolute;
      if (absoluteC && absoluteC.type === 'range') {
        if (absoluteC.min != null && u.firstPayment.value < absoluteC.min) {
          msgs.push(getErrorMsg('firstPaymentAbsoluteMin', { min: absoluteC.min }));
        }
        if (absoluteC.max != null && u.firstPayment.value > absoluteC.max) {
          msgs.push(getErrorMsg('firstPaymentAbsoluteMax', { max: absoluteC.max }));
        }
      }
      // If only percent constraints exist, validate absolute against equivalent absolute
      const percentC = t.constraints?.firstPaymentPercent;
      if (percentC && percentC.type === 'range' && isFinite(principalNum) && principalNum > 0) {
        if (percentC.min != null) {
          const minAbs = (principalNum * percentC.min) / 100;
          if (u.firstPayment.value < minAbs) {
            msgs.push(getErrorMsg('firstPaymentAbsoluteMin', { min: Number(minAbs.toFixed(2)) }));
          }
        }
        if (percentC.max != null) {
          const maxAbs = (principalNum * percentC.max) / 100;
          if (u.firstPayment.value > maxAbs) {
            msgs.push(getErrorMsg('firstPaymentAbsoluteMax', { max: Number(maxAbs.toFixed(2)) }));
          }
        }
      }
    }
  }
  // grace constraints (template-defined values)
  if (t.grace) {
    const months = u.graceMonths ?? t.grace.months;
    const monthsC = t.constraints?.graceMonths;
    if (monthsC) {
      if (monthsC.type === 'enum' && !monthsC.values.includes(months)) {
        msgs.push(getErrorMsg('graceMonthsMustBeOneOf', { values: monthsC.values.join(', ') }));
      }
      if (monthsC.type === 'range') {
        if (monthsC.min != null && months < monthsC.min) {
          msgs.push(getErrorMsg('graceMonthsAtLeast', { min: monthsC.min }));
        }
        if (monthsC.max != null && months > monthsC.max) {
          msgs.push(getErrorMsg('graceMonthsAtMost', { max: monthsC.max }));
        }
      }
    }
    if (t.grace.type === 'ReducedRate') {
      const rr = (u.graceReducedRatePercent ?? t.grace.reducedAnnualRatePercent) ?? undefined;
      const rrC = t.constraints?.graceReducedAnnualRatePercent;
      if (rr != null && rrC) {
        if (rrC.type === 'enum' && !rrC.values.includes(rr)) {
          msgs.push(getErrorMsg('graceReducedRateMustBeOneOf', { values: rrC.values.join(', ') }));
        }
        if (rrC.type === 'range') {
          if (rrC.min != null && rr < rrC.min) {
            msgs.push(getErrorMsg('graceReducedRateAtLeast', { min: rrC.min }));
          }
          if (rrC.max != null && rr > rrC.max) {
            msgs.push(getErrorMsg('graceReducedRateAtMost', { max: rrC.max }));
          }
        }
      }
    }
  }
  return { ok: msgs.length === 0, messages: msgs };
}

