import React from 'react';
import { LoanResult, toCSV } from '../../loan-engine';
import { useI18n } from '../../i18n/context';

export function ScheduleTable({ result }: { result: LoanResult }) {
  const { t } = useI18n();
  
  function handleExportCSV() {
    const csv = toCSV(result);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `loan-schedule-${result.id || result.currency || 'loan'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          onClick={handleExportCSV}
          className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-700 shadow-soft hover:bg-neutral-50 hover:shadow-medium transition-all duration-200"
        >
          {t.schedule.exportCSV}
        </button>
      </div>
      <div className="overflow-auto border border-neutral-200 rounded-lg shadow-soft">
        <table className="min-w-full text-sm">
          <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">{t.schedule.month}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">{t.schedule.installment}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">{t.schedule.interest}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">{t.schedule.principal}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider">{t.schedule.remaining}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-200">
            {result.schedule.map((r) => (
              <tr key={r.monthIndex} className="hover:bg-primary-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-neutral-900">{r.monthIndex}</td>
                <td className="px-4 py-3 text-neutral-700">{r.installment}</td>
                <td className="px-4 py-3 text-neutral-700">{r.interestPortion}</td>
                <td className="px-4 py-3 text-neutral-700">{r.principalPortion}</td>
                <td className="px-4 py-3 text-neutral-700">{r.remainingPrincipal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

