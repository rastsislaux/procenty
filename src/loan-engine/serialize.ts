import { LoanResult } from "./types";

export function toJSON(result: LoanResult): string {
  return JSON.stringify(result, null, 2);
}

export function toCSV(result: LoanResult): string {
  const header = [
    "monthIndex",
    "installment",
    "interestPortion",
    "principalPortion",
    "remainingPrincipal",
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
      r.periodicRate,
      r.notes?.join("|") ?? ""
    ].join(","));
  }
  return lines.join("\n");
}

