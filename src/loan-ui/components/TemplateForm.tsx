import React, { useMemo, useState } from 'react';
import { Listbox, Combobox, Dialog, Switch } from '@headlessui/react';
import { Select } from './Select';
import { Template } from '../../config/loan-templates';
import { clsx } from 'clsx';

type Props = {
  value: Template;
  onChange: (tpl: Template) => void;
  onSubmit?: () => void;
};

const currencies = ['USD', 'EUR', 'BYN', 'GBP'] as const;
const amortizations = ['Annuity', 'Differentiated'] as const;
const dayCounts = ['30E_360', 'Actual_365', 'Actual_Actual'] as const;

export function TemplateForm({ value, onChange, onSubmit }: Props) {
  const [openGrace, setOpenGrace] = useState(!!value.grace);

  function update<K extends keyof Template>(key: K, val: Template[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2"
          value={value.name}
          onChange={(e) => update('name', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Currency</label>
          <Select options={currencies.map(c => ({ value: c, label: c }))} value={value.currency ?? 'USD'} onChange={(v) => update('currency', v as any)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Amortization</label>
          <Select options={amortizations.map(a => ({ value: a, label: a }))} value={value.amortization ?? 'Annuity'} onChange={(v) => update('amortization', v as any)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Day Count</label>
          <Select options={dayCounts.map(d => ({ value: d, label: d }))} value={value.dayCount ?? '30E_360'} onChange={(v) => update('dayCount', v as any)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Rate (%)</label>
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded border px-3 py-2"
            value={value.nominalAnnualRatePercent ?? ''}
            onChange={(e) => update('nominalAnnualRatePercent', e.target.value === '' ? undefined : Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Term (months)</label>
          <input
            type="number"
            className="mt-1 w-full rounded border px-3 py-2"
            value={value.termMonths ?? ''}
            onChange={(e) => update('termMonths', e.target.value === '' ? undefined : Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={value.description ?? ''}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded p-3">
        <div className="flex items-center justify-between">
          <div className="font-medium">Grace period</div>
          <Switch
            checked={openGrace}
            onChange={(v) => { setOpenGrace(v); if (!v) update('grace', undefined); else update('grace', { type: 'InterestOnly', months: 3 }); }}
            className={clsx('relative inline-flex h-6 w-11 items-center rounded-full', openGrace ? 'bg-blue-600' : 'bg-gray-300')}
          >
            <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-white transition', openGrace ? 'translate-x-6' : 'translate-x-1')} />
          </Switch>
        </div>
        {openGrace && value.grace && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Type</label>
              <Listbox value={value.grace.type} onChange={(v) => update('grace', { ...value.grace!, type: v as any })}>
                <Listbox.Button className="w-full mt-1 rounded border px-3 py-2 text-left">{value.grace.type}</Listbox.Button>
                <Listbox.Options className="mt-1 rounded border bg-white shadow">
                  {['InterestOnly', 'ReducedRate'].map((t) => (
                    <Listbox.Option key={t} value={t} className="px-3 py-2 hover:bg-gray-50 cursor-pointer">{t}</Listbox.Option>
                  ))}
                </Listbox.Options>
              </Listbox>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Months</label>
              <input
                type="number"
                className="mt-1 w-full rounded border px-3 py-2"
                value={value.grace.months}
                onChange={(e) => update('grace', { ...value.grace!, months: Number(e.target.value) })}
              />
            </div>
            {value.grace.type === 'ReducedRate' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Reduced APR (%)</label>
                <input
                  type="number" step="0.01"
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={value.grace.reducedAnnualRatePercent ?? 0}
                  onChange={(e) => update('grace', { ...value.grace!, reducedAnnualRatePercent: Number(e.target.value) })}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border rounded p-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="font-medium">Allow first payment</div>
            <Switch
              checked={!!value.allowFirstPayment}
              onChange={(v) => update('allowFirstPayment', v as any)}
              className={clsx('relative inline-flex h-6 w-11 items-center rounded-full', value.allowFirstPayment ? 'bg-blue-600' : 'bg-gray-300')}
            >
              <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-white transition', value.allowFirstPayment ? 'translate-x-6' : 'translate-x-1')} />
            </Switch>
          </div>
          <div className="flex items-center gap-3">
            <div className="font-medium">Allow prepayments</div>
            <Switch
              checked={!!value.prepaymentsAllowed}
              onChange={(v) => update('prepaymentsAllowed', v as any)}
              className={clsx('relative inline-flex h-6 w-11 items-center rounded-full', value.prepaymentsAllowed ? 'bg-blue-600' : 'bg-gray-300')}
            >
              <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-white transition', value.prepaymentsAllowed ? 'translate-x-6' : 'translate-x-1')} />
            </Switch>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button className="px-4 py-2 rounded bg-blue-600 text-white" type="submit">Save</button>
      </div>
    </form>
  );
}

