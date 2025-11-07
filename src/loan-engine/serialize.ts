import { LoanResult } from "./types";

export function toJSON(result: LoanResult): string {
  return JSON.stringify(result, null, 2);
}

export function toCSV(result: LoanResult): string {
  const hasInflation = result.schedule.length > 0 && result.schedule[0].installmentPV != null;
  const header = [
    "monthIndex",
    "installment",
    "interestPortion",
    "principalPortion",
    "remainingPrincipal",
    ...(hasInflation ? ["installmentPV", "interestPortionPV", "principalPortionPV", "remainingPrincipalPV"] : []),
    "periodicRate",
    "notes"
  ];
  const lines = [header.join(",")];
  for (const r of result.schedule) {
    lines.push([
      r.monthIndex,
      r.installment,
      r.interestPortion,
      r.principalPortion,
      r.remainingPrincipal,
      ...(hasInflation ? [
        r.installmentPV ?? "",
        r.interestPortionPV ?? "",
        r.principalPortionPV ?? "",
        r.remainingPrincipalPV ?? ""
      ] : []),
      r.periodicRate,
      r.notes?.join("|") ?? ""
    ].join(","));
  }
  return lines.join("\n");
}

