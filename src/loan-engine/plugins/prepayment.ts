import { Decimal, toDecimal, ZERO } from "../math/decimal";
import { PrepaymentEvent, PrepaymentPolicy, PrepaymentPolicyContext } from "../types";

export class ReduceTermPolicy implements PrepaymentPolicy {
  readonly id = "ReduceTerm" as const;
  apply(extraPrincipalPaid: string, ctx: PrepaymentPolicyContext) {
    const newRemainingPrincipal = toDecimal(ctx.remainingPrincipal).minus(toDecimal(extraPrincipalPaid));
    return { newRemainingPrincipal: newRemainingPrincipal.toString(), recomputeInstallment: false };
  }
}

export class ReduceInstallmentPolicy implements PrepaymentPolicy {
  readonly id = "ReduceInstallment" as const;
  apply(extraPrincipalPaid: string, ctx: PrepaymentPolicyContext) {
    const newRemainingPrincipal = toDecimal(ctx.remainingPrincipal).minus(toDecimal(extraPrincipalPaid));
    return { newRemainingPrincipal: newRemainingPrincipal.toString(), recomputeInstallment: true };
  }
}

export function expandPrepaymentEvents(events: PrepaymentEvent[] | undefined, totalMonths: number): Map<number, PrepaymentEvent[]> {
  const map = new Map<number, PrepaymentEvent[]>();
  if (!events) return map;
  for (const ev of events) {
    if ("month" in ev.monthRange) {
      const m = ev.monthRange.month;
      if (m >= 1 && m <= totalMonths) {
        map.set(m, [...(map.get(m) ?? []), ev]);
      }
    } else {
      const { start, end, step = 1 } = ev.monthRange;
      for (let m = start; m <= end && m <= totalMonths; m += step) {
        if (m >= 1) map.set(m, [...(map.get(m) ?? []), ev]);
      }
    }
  }
  return map;
}

export function computeExtraFromEvent(
  ev: PrepaymentEvent,
  baseInstallment: string,
  currentRemaining: string
): string {
  switch (ev.mode.type) {
    case "Amount":
      return ev.mode.amount;
    case "TargetPrincipal": {
      const target = toDecimal(ev.mode.principal);
      const diff = toDecimal(currentRemaining).minus(target);
      return diff.lessThan(ZERO) ? "0" : diff.toString();
    }
    case "ExtraInstallmentPercent": {
      const p = toDecimal(ev.mode.percent).div(100);
      return toDecimal(baseInstallment).mul(p).toString();
    }
  }
}

export const PrepaymentPolicies = {
  ReduceTerm: new ReduceTermPolicy(),
  ReduceInstallment: new ReduceInstallmentPolicy()
};

