# Loan Engine (Phase 1, Plugin Architecture) – Design and Implementation Plan

## Overview

Build a pure TypeScript loan calculation engine with batch processing. It generates detailed monthly schedules, aggregates totals/metadata, supports multiple day-count conventions, amortization types, grace period, custom prepayments with selectable policies, and export (JSON/CSV). Designed as a framework-agnostic module under `src/loan-engine/` to plug into a React static site later.

## Scope (this phase)

- Core math and schedule generator (monthly frequency)
- Options for day-count conventions and prepayment policies
- Annuity (fixed installment) and differentiated (declining) amortization
- Grace period with separate rate (interest-only default), supports extra principal during grace
- Custom prepayments (single month or ranges) with policy control
- Batch API for multiple loans
- Deterministic rounding and currency precision
- Exporters (JSON, CSV)
- Unit tests for correctness

## Directory layout

```
src/
  loan-engine/
    index.ts
    types.ts
    math/
      decimal.ts           # thin wrapper over decimal.js (pluggable)
      dayCount.ts          # day-count conventions
      rate.ts              # APR→period rate, effective annual, etc.
      amortization.ts      # annuity & differentiated formulas
    schedule/
      prepayment.ts        # prepayment/range handling & policies
      grace.ts             # grace period handling (interest-only + reduced-rate hook)
      generator.ts         # main schedule builder
      aggregators.ts       # totals, extrema, metadata
    batch.ts
    serialize.ts           # JSON/CSV exporters
    errors.ts
    utils.ts

test/
  loan-engine/*.test.ts
```

## Core types (essential)

```ts
// src/loan-engine/types.ts
export type CurrencyCode = string; // ISO 4217 (e.g., "USD", "EUR")

export type DayCountConvention =
  | "30E_360"
  | "Actual_365"
  | "Actual_Actual";

export type AmortizationType = "Annuity" | "Differentiated";

export type PrepaymentPolicy =
  | "ReduceTerm"        // keep installment, shorten term
  | "ReduceInstallment" // keep term, lower installment
  | "ChoosePerEvent";   // use per-event override

export type PrepaymentEvent = {
  id?: string;
  monthRange:
    | { month: number }                    // 1-based month index
    | { start: number; end: number; step?: number };
  mode:
    | { type: "Amount"; amount: string } // fixed extra amount
    | { type: "TargetPrincipal"; principal: string }
    | { type: "ExtraInstallmentPercent"; percent: number }; // e.g., +20%
  policyOverride?: Exclude<PrepaymentPolicy, "ChoosePerEvent">;
};

export type GraceMode = "InterestOnly" | "ReducedRate"; // default InterestOnly

export interface GracePeriodConfig {
  months: number;              // 0 for none
  annualRateOverride?: number; // if provided, applies during grace
  mode?: GraceMode;
}

export interface FirstPaymentConfig {
  type: "Percent" | "Absolute";
  value: number; // percent as 0-100, absolute in currency units
}

export interface LoanConfig {
  id?: string;                 // bank/offer identifier
  currency: CurrencyCode;
  principal: string;           // decimal as string for precision
  annualRate: number;          // nominal APR (e.g., 12.5 for 12.5%)
  termMonths: number;          // total months
  amortization: AmortizationType;
  dayCount: DayCountConvention;
  compoundingPerYear?: number; // default 12
  grace?: GracePeriodConfig;
  firstPayment?: FirstPaymentConfig; // optional
  prepayments?: PrepaymentEvent[];
  prepaymentPolicy?: PrepaymentPolicy; // default ReduceTerm
}

export interface ScheduleRow {
  monthIndex: number;               // 1..N
  installment: string;              // total payment
  interestPortion: string;
  principalPortion: string;
  remainingPrincipal: string;
  periodicRate: string;             // actual rate used this month
  notes?: string[];                 // e.g., "grace", "prepayment"
}

export interface LoanResultMeta {
  totalPaid: string;
  totalInterest: string;
  maxInstallment: string;
  minInstallment: string;
  payoffMonth: number;              // actual number of months taken
}

export interface LoanResult {
  id?: string;
  currency: CurrencyCode;
  schedule: ScheduleRow[];
  meta: LoanResultMeta;
}
```

## Calculation rules (concise)

- Day-count: support 30E/360, Actual/365, Actual/Actual (ISDA-like). Monthly frequency; we derive an effective monthly rate from nominal APR + day-count.
- Rounding: use decimal arithmetic; round displayed money to currency scale (default 2) but keep internal precision higher.
- Annuity: fixed installment outside grace; recompute as needed for ReduceInstallment policy.
- Differentiated: principal portion = principal/remainingMonths; interest on remaining principal using period rate.
- Grace period:
  - InterestOnly: pay interest only (at override APR if provided); extra custom payments reduce principal.
  - ReducedRate: compute with overridden APR during grace; installment mode per amortization.
- First payment: if Absolute, cap at outstanding balance + interest; if Percent, compute as percent of principal; apply before or alongside normal schedule on month 1.
- Prepayments: events can target amounts, target principal, or % extra of installment; policy = ReduceTerm or ReduceInstallment (or per-event override).
- Early payoff: stop schedule when remaining principal ≤ epsilon after applying payments.

## Public API (stable)

```ts
// src/loan-engine/index.ts
export function computeLoan(config: LoanConfig): LoanResult;
export function computeBatch(configs: LoanConfig[]): LoanResult[];
export function toJSON(result: LoanResult): string;              // pretty JSON
export function toCSV(result: LoanResult): string;               // schedule CSV
```

## Error handling

- Validate inputs (negative/zero values, inconsistent ranges) and throw typed errors from `errors.ts`.
- Guard against negative amortization and impossible first-payment configs.

## Testing (Vitest)

- Deterministic schedules for known cases (annuity vs differentiated)
- Grace interest-only vs reduced-rate
- Prepayment policies (term reduction vs installment reduction)
- Day-count differences produce expected interest deltas
- Early payoff and totals/metadata

## Extensibility hooks (future)

- Additional day-counts and payment frequencies (weekly/biweekly)
- Variable-rate schedules via `rate schedule` input
- Fees and APR/IRR computation
- Multi-currency FX conversion (UI concern), currency scale map
- React UI: pages via React Router, Headless UI components, download via Blob

## Minimal usage example (later in a dev harness)

```ts
import { computeLoan, toCSV } from "./loan-engine";

const result = computeLoan({
  id: "BankA-Std",
  currency: "USD",
  principal: "20000",
  annualRate: 9.5,
  termMonths: 36,
  amortization: "Annuity",
  dayCount: "30E_360",
  grace: { months: 3, mode: "InterestOnly", annualRateOverride: 6 },
  firstPayment: { type: "Percent", value: 10 },
  prepayments: [
    { monthRange: { month: 6 }, mode: { type: "Amount", amount: "500" } },
    { monthRange: { start: 12, end: 24, step: 3 }, mode: { type: "ExtraInstallmentPercent", percent: 20 }, policyOverride: "ReduceTerm" }
  ],
  prepaymentPolicy: "ReduceInstallment"
});

const csv = toCSV(result); // UI will download this as a file
```

## Out of scope (this phase)

- React UI, routing, and Headless UI components (next phase)
- Templates for banks/offers (next phase)
- Browser file download (handled by UI using Blob)
