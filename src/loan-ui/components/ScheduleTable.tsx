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
    <div className="space-y-2">
      <div className="flex justify-end">
        <button
          onClick={handleExportCSV}
          className="px-3 py-1 text-sm rounded border bg-blue-600 text-white hover:bg-blue-700"
        >
          {t.schedule.exportCSV}
        </button>
      </div>
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">{t.schedule.month}</th>
              <th className="px-3 py-2 text-left">{t.schedule.installment}</th>
              <th className="px-3 py-2 text-left">{t.schedule.interest}</th>
              <th className="px-3 py-2 text-left">{t.schedule.principal}</th>
              <th className="px-3 py-2 text-left">{t.schedule.remaining}</th>
            </tr>
          </thead>
          <tbody>
            {result.schedule.map((r) => (
              <tr key={r.monthIndex} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-1">{r.monthIndex}</td>
                <td className="px-3 py-1">{r.installment}</td>
                <td className="px-3 py-1">{r.interestPortion}</td>
                <td className="px-3 py-1">{r.principalPortion}</td>
                <td className="px-3 py-1">{r.remainingPrincipal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

