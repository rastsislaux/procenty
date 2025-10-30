import { LoanConfig, LoanResult } from "./types";
import { computeLoan } from "./schedule/generator";

export function computeBatch(configs: LoanConfig[]): LoanResult[] {
  return configs.map((cfg) => computeLoan(cfg));
}

