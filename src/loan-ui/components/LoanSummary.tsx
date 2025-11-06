import React from 'react';
import { LoanResult } from '../../loan-engine';
import { useI18n } from '../../i18n/context';

export function LoanSummary({ result }: { result: LoanResult }) {
  const { t } = useI18n();
  const m = result.meta;
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
      <SummaryCard label={t.loans.currency} value={result.currency} />
      <SummaryCard label={t.loanSummary.totalPaid} value={m.totalPaid} />
      <SummaryCard label={t.loanSummary.totalInterest} value={m.totalInterest} />
      <SummaryCard label={t.loanSummary.maxInstallment} value={m.maxInstallment} />
      <SummaryCard label={t.loanSummary.minInstallment} value={m.minInstallment} />
      <SummaryCard label={t.loanSummary.payoffMonth} value={String(m.payoffMonth)} />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border bg-white p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-base font-medium">{value}</div>
    </div>
  );
}

