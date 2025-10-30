// Core public interfaces and types for the plugin architecture

export interface Currency {
  readonly code: string; // ISO 4217 (e.g., "USD")
  readonly scale: number; // decimals for minor unit (e.g., 2)
  round(amount: string): string; // round to currency scale for display
}

export interface DayCountContext {
  startDate?: Date; // optional schedule start date
  compoundingPerYear: number; // default 12
}

export interface DayCountConvention {
  readonly id: string;
  getPeriodicRate(nominalAnnualRatePercent: number, monthIndex: number, ctx: DayCountContext): string;
}

export interface AmortizationContext {
  monthIndex: number;
  periodicRate: string;
  remainingMonths: number;
}

export interface AmortizationStrategy {
  readonly id: string;
  computeInstallment(remainingPrincipal: string, ctx: AmortizationContext): string;
  computePrincipalPortion(installment: string, periodicRate: string, remainingPrincipal: string): string;
}

export type GraceMode = "InterestOnly" | "ReducedRate";

export interface GraceContext {
  monthIndex: number;
  periodicRate: string; // monthly periodic rate for this month
  remainingPrincipal: string;
}

export interface GracePeriodStrategy {
  readonly id: string;
  readonly months: number;
  // Optionally override periodic rate (e.g., reduced rate during grace)
  overridePeriodicRate?(nominalAnnualRatePercent: number, monthIndex: number): number | undefined;
  // Provide installment override for grace months (e.g., interest-only)
  overrideInstallment?(ctx: GraceContext): { installment: string; interest: string; principal: string } | undefined;
}

export type PrepaymentAmountMode =
  | { type: "Amount"; amount: string }
  | { type: "TargetPrincipal"; principal: string }
  | { type: "ExtraInstallmentPercent"; percent: number };

export type PrepaymentMonthRange = { month: number } | { start: number; end: number; step?: number };

export interface PrepaymentEvent {
  id?: string;
  monthRange: PrepaymentMonthRange;
  mode: PrepaymentAmountMode;
  policyOverride?: "ReduceTerm" | "ReduceInstallment";
}

export interface PrepaymentPolicyContext {
  monthIndex: number;
  installment: string;
  periodicRate: string;
  remainingPrincipal: string;
  remainingMonths: number;
}

export interface PrepaymentPolicy {
  readonly id: "ReduceTerm" | "ReduceInstallment";
  apply(
    extraPrincipalPaid: string,
    ctx: PrepaymentPolicyContext
  ): { newRemainingPrincipal: string; recomputeInstallment: boolean };
}

export interface FirstPaymentConfig {
  type: "Percent" | "Absolute";
  value: number; // percent as 0-100, absolute in currency units
}

export interface LoanConfig {
  id?: string;
  currency: Currency;
  principal: string; // decimal as string
  nominalAnnualRatePercent: number; // e.g., 12.5 for 12.5%
  termMonths: number;
  amortization: AmortizationStrategy;
  dayCount: DayCountConvention;
  compoundingPerYear?: number; // default 12
  startDate?: Date | string;
  grace?: GracePeriodStrategy | null;
  firstPayment?: FirstPaymentConfig;
  prepayments?: PrepaymentEvent[];
  prepaymentPolicy?: PrepaymentPolicy;
}

export interface ScheduleRow {
  monthIndex: number; // 1..N
  installment: string; // total payment
  interestPortion: string;
  principalPortion: string;
  remainingPrincipal: string;
  periodicRate: string; // per-month decimal (e.g., 0.01 for 1%)
  notes?: string[];
}

export interface LoanResultMeta {
  totalPaid: string;
  totalInterest: string;
  maxInstallment: string;
  minInstallment: string;
  payoffMonth: number;
}

export interface LoanResult {
  id?: string;
  currency: string;
  schedule: ScheduleRow[];
  meta: LoanResultMeta;
}

