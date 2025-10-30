import React, { useMemo, useState } from 'react';
import { LoanResult } from '../../loan-engine';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Dialog } from '@headlessui/react';
import { ScheduleTable } from './ScheduleTable';
import { useI18n } from '../../i18n/context';

export function ComparePanel({ results, names }: { results: LoanResult[]; names?: Record<string, string> }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<LoanResult | null>(null);
  const [showInstallment, setShowInstallment] = useState(true);
  const [showPrincipal, setShowPrincipal] = useState(false);
  const [showInterest, setShowInterest] = useState(false);
  const chartData = useMemo(() => {
    if (results.length === 0) return [];
    const maxLen = Math.max(...results.map(r => r.schedule.length));
    const rows: any[] = [];
    for (let i = 0; i < maxLen; i++) {
      const row: any = { month: i + 1 };
      for (const r of results) {
        const prefix = names?.[r.id || ''] ?? r.id ?? r.currency;
        const sched = r.schedule[i];
        if (sched) {
          row[`${prefix} installment`] = Number(String(sched.installment).replace(/,/g, ''));
          row[`${prefix} principal`] = Number(String(sched.principalPortion).replace(/,/g, ''));
          row[`${prefix} interest`] = Number(String(sched.interestPortion).replace(/,/g, ''));
        }
      }
      rows.push(row);
    }
    return rows;
  }, [results, names]);
  if (results.length === 0) return null;
  return (
    <div className="space-y-4">
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-3 py-2 text-left">{t.compare.templates}</th>
            <th className="px-3 py-2 text-left">{t.templates.currency}</th>
            <th className="px-3 py-2 text-left">{t.compare.totalPaid}</th>
            <th className="px-3 py-2 text-left">{t.compare.totalInterest}</th>
            <th className="px-3 py-2 text-left">{t.compare.payoffMonth}</th>
            <th className="px-3 py-2 text-left">{t.compare.maxInstallment}</th>
            <th className="px-3 py-2 text-left">{t.compare.minInstallment}</th>
            <th className="px-3 py-2 text-left"></th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.id ?? r.currency} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100">
              <td className="px-3 py-1">{names?.[r.id || ''] ?? r.id ?? '-'}</td>
              <td className="px-3 py-1">{r.currency}</td>
              <td className="px-3 py-1">{r.meta.totalPaid}</td>
              <td className="px-3 py-1">{r.meta.totalInterest}</td>
              <td className="px-3 py-1">{r.meta.payoffMonth}</td>
              <td className="px-3 py-1">{r.meta.maxInstallment}</td>
              <td className="px-3 py-1">{r.meta.minInstallment}</td>
              <td className="px-3 py-1">
                <button className="text-blue-600 hover:underline text-xs" onClick={() => setSelected(r)}>{t.common.schedule}</button>
              </td>
            </tr>
          ))}
        </tbody>
        </table>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-4 text-sm border rounded p-2 bg-gray-50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showInstallment} onChange={(e) => setShowInstallment(e.target.checked)} />
            <span>{t.compare.installment}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showPrincipal} onChange={(e) => setShowPrincipal(e.target.checked)} />
            <span>{t.compare.principal}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showInterest} onChange={(e) => setShowInterest(e.target.checked)} />
            <span>{t.compare.interest}</span>
          </label>
        </div>
        <div className="h-72 w-full border rounded">
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {results.flatMap((r, idx) => {
                const prefix = names?.[r.id || ''] ?? r.id ?? r.currency;
                const colors = ['#2563eb', '#16a34a', '#ef4444', '#7c3aed', '#f59e0b'];
                const baseColor = colors[idx % colors.length];
                const lines = [];
                if (showInstallment) {
                  lines.push(<Line key={`${prefix}-installment`} type="monotone" dataKey={`${prefix} installment`} stroke={baseColor} dot={false} name={`${prefix} - Installment`} strokeDasharray="5 5" />);
                }
                if (showPrincipal) {
                  lines.push(<Line key={`${prefix}-principal`} type="monotone" dataKey={`${prefix} principal`} stroke={baseColor} dot={false} name={`${prefix} - Principal`} />);
                }
                if (showInterest) {
                  lines.push(<Line key={`${prefix}-interest`} type="monotone" dataKey={`${prefix} interest`} stroke={baseColor} dot={false} name={`${prefix} - Interest`} strokeDasharray="3 3" />);
                }
                return lines;
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Dialog open={!!selected} onClose={() => setSelected(null)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-4xl max-h-[80vh] overflow-auto rounded bg-white p-4">
            <Dialog.Title className="text-lg font-medium mb-3">
              {t.common.schedule} - {selected && (names?.[selected.id || ''] ?? selected.id ?? selected.currency)}
            </Dialog.Title>
            {selected && <ScheduleTable result={selected} />}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}

