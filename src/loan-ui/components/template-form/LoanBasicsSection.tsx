import React from 'react';
import { Select } from '../../../shared/components/Select';
import { Template } from '../../../config/loan-templates';

const currencies = ['USD', 'EUR', 'BYN', 'GBP'] as const;
const amortizations = ['Annuity', 'Differentiated'] as const;
const dayCounts = ['30E_360', 'Actual_365', 'Actual_Actual'] as const;

export function LoanBasicsSection({ value, onChange }: { value: Template; onChange: (tpl: Template) => void }) {
  function update<K extends keyof Template>(key: K, val: Template[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={value.name} onChange={(e) => update('name', e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Currency</label>
          <Select options={currencies.map((c) => ({ value: c, label: c }))} value={value.currency ?? 'USD'} onChange={(v) => update('currency', v as any)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Amortization</label>
          <Select options={amortizations.map((a) => ({ value: a, label: a }))} value={value.amortization ?? 'Annuity'} onChange={(v) => update('amortization', v as any)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Day Count</label>
          <Select options={dayCounts.map((d) => ({ value: d, label: d }))} value={value.dayCount ?? '30E_360'} onChange={(v) => update('dayCount', v as any)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Rate (%)</label>
          <input type="number" step="0.01" className="mt-1 w-full rounded border px-3 py-2" value={value.nominalAnnualRatePercent ?? ''} onChange={(e) => update('nominalAnnualRatePercent', e.target.value === '' ? undefined : Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Term (months)</label>
          <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={value.termMonths ?? ''} onChange={(e) => update('termMonths', e.target.value === '' ? undefined : Number(e.target.value))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={value.description ?? ''} onChange={(e) => update('description', e.target.value)} />
        </div>
      </div>
    </>
  );
}


