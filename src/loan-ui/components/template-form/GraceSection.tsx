import React from 'react';
import { Listbox, Switch } from '@headlessui/react';
import { Template } from '../../../config/loan-templates';
import { clsx } from 'clsx';

export function GraceSection({ value, open, onToggle, onChange }: { value: Template; open: boolean; onToggle: (v: boolean) => void; onChange: (tpl: Template) => void }) {
  function updateGrace<K extends keyof NonNullable<Template['grace']>>(key: K, val: NonNullable<Template['grace']>[K]) {
    if (!value.grace) return;
    onChange({ ...value, grace: { ...value.grace, [key]: val } as any });
  }

  return (
    <div className="border rounded p-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">Grace period</div>
        <Switch checked={open} onChange={(v) => { onToggle(v); if (!v) onChange({ ...value, grace: undefined }); else onChange({ ...value, grace: { type: 'InterestOnly', months: 3 } as any }); }} className={clsx('relative inline-flex h-6 w-11 items-center rounded-full', open ? 'bg-blue-600' : 'bg-gray-300')}>
          <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-white transition', open ? 'translate-x-6' : 'translate-x-1')} />
        </Switch>
      </div>
      {open && value.grace && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <Listbox value={value.grace.type} onChange={(v) => onChange({ ...value, grace: { ...value.grace!, type: v as any } })}>
              <Listbox.Button className="w-40 mt-1 rounded border px-3 py-2 text-left">{value.grace.type}</Listbox.Button>
              <Listbox.Options className="mt-1 rounded border bg-white shadow">
                {['InterestOnly', 'ReducedRate'].map((t) => (
                  <Listbox.Option key={t} value={t} className="px-3 py-2 hover:bg-gray-50 cursor-pointer">{t}</Listbox.Option>
                ))}
              </Listbox.Options>
            </Listbox>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Months</label>
            <input type="number" className="mt-1 w-24 rounded border px-3 py-2" value={value.grace.months} onChange={(e) => updateGrace('months', Number(e.target.value))} />
          </div>
          {value.grace.type === 'ReducedRate' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Reduced APR (%)</label>
              <input type="number" step="0.01" className="mt-1 w-28 rounded border px-3 py-2" value={value.grace.reducedAnnualRatePercent ?? 0} onChange={(e) => updateGrace('reducedAnnualRatePercent', Number(e.target.value))} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}


