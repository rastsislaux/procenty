import { describe, it, expect } from "vitest";
import { Amortizations, Currencies, DayCounts, GracePeriods, PrepaymentPolicies, computeLoan, toCSV } from "../../src/loan-engine";

describe("loan engine - basic annuity", () => {
  it("computes a small annuity schedule with interest-only grace and prepayment", () => {
    const res = computeLoan({
      id: "BankA-Std",
      currency: Currencies.USD,
      principal: "20000",
      nominalAnnualRatePercent: 9.5,
      termMonths: 24,
      amortization: Amortizations.Annuity,
      dayCount: DayCounts.ThirtyE360,
      compoundingPerYear: 12,
      grace: GracePeriods.InterestOnly(2),
      prepayments: [
        { monthRange: { month: 6 }, mode: { type: "Amount", amount: "500" }, policyOverride: "ReduceTerm" }
      ],
      prepaymentPolicy: PrepaymentPolicies.ReduceInstallment
    });
    expect(res.schedule.length).toBeGreaterThan(0);
    expect(res.currency).toBe("USD");
    // Totals should be > principal
    expect(Number(res.meta.totalPaid.replace(/,/g, ""))).toBeGreaterThan(20000);
    const csv = toCSV(res);
    expect(csv.split("\n").length).toBe(res.schedule.length + 1);
  });
});
