import React from 'react';
import { Select } from './Select';
import { useI18n } from '../../i18n/context';
import { IconButton } from './IconButton';

export function PrepaymentEditor({ events, onChange }: { events: any[]; onChange: (e: any[]) => void }) {
  const { t } = useI18n();
  function add() {
    onChange([...events, { rangeType: 'single', month: 6, endMonth: null, step: null, type: 'Amount', amount: 500, policy: 'ReduceTerm' }]);
  }
  function update(idx: number, patch: any) {
    const next = events.slice();
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  }
  function remove(idx: number) {
    const next = events.slice();
    next.splice(idx, 1);
    onChange(next);
  }
  return (
    <div className="space-y-2">
      {events.map((ev, idx) => (
        <div key={idx} className="border p-2 rounded space-y-1.5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-600">{t.prepaymentEditor.rangeType}</label>
              <div className="mt-0.5">
                <Select options={[{value:'single',label:t.prepaymentEditor.singleMonth},{value:'range',label:t.prepaymentEditor.range}]} value={ev.rangeType ?? 'single'} onChange={(v)=>update(idx,{ rangeType: v, month: ev.month ?? 6, endMonth: v === 'range' ? (ev.endMonth ?? ev.month ?? 6) : null })} />
              </div>
            </div>
            {ev.rangeType === 'single' ? (
              <div>
                <label className="block text-xs text-gray-600">{t.prepaymentEditor.month}</label>
                <input type="number" className="mt-0.5 w-full rounded border px-2 py-2 text-sm" value={ev.month ?? 6} onChange={(e) => update(idx, { month: Number(e.target.value) })} />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-gray-600">{t.prepaymentEditor.startMonth}</label>
                  <input type="number" className="mt-0.5 w-full rounded border px-2 py-2 text-sm" value={ev.month ?? 6} onChange={(e) => update(idx, { month: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">{t.prepaymentEditor.endMonth}</label>
                  <input type="number" className="mt-0.5 w-full rounded border px-2 py-2 text-sm" value={ev.endMonth ?? ev.month ?? 6} onChange={(e) => update(idx, { endMonth: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">{t.prepaymentEditor.stepOptional}</label>
                  <input type="number" className="mt-0.5 w-full rounded border px-2 py-2 text-sm" value={ev.step ?? ''} placeholder="1" onChange={(e) => update(idx, { step: e.target.value === '' ? null : Number(e.target.value) })} />
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-xs text-gray-600">{t.prepaymentEditor.mode}</label>
              <div className="mt-0.5">
                <Select options={[{value:'Amount',label:t.fields.amount},{value:'ExtraInstallmentPercent',label:`${t.fields.percent} ${t.compare.installment.toLowerCase()}`}]} value={ev.type} onChange={(v)=>update(idx,{ type: v })} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600">{t.prepaymentEditor.value}</label>
              <input type="number" step="0.01" className="mt-0.5 w-full rounded border px-2 py-2 text-sm" value={ev.type === 'Amount' ? ev.amount : ev.percent ?? 0} onChange={(e) => update(idx, ev.type === 'Amount' ? { amount: Number(e.target.value) } : { percent: Number(e.target.value) })} />
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-600">{t.prepaymentEditor.policy}</label>
                <div className="mt-0.5">
                  <Select options={[{value:'ReduceTerm',label:t.fields.reduceTerm},{value:'ReduceInstallment',label:t.fields.reduceInstallment}]} value={ev.policy} onChange={(v)=>update(idx,{ policy: v })} />
                </div>
              </div>
              <IconButton label={t.common.remove} title={t.common.remove} onClick={() => remove(idx)}>
                <span aria-hidden>×</span>
              </IconButton>
            </div>
          </div>
        </div>
      ))}
      <button className="px-2 py-1 text-sm rounded border" onClick={add}>{t.calculator.prepayments}</button>
    </div>
  );
}

