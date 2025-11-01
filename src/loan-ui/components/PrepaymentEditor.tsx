import React from 'react';
import { Select } from '../../shared/components/Select';
import { FormLabel } from '../../shared/components/FormLabel';
import { FormInput } from '../../shared/components/FormInput';
import { Button } from '../../shared/components/Button';
import { useI18n } from '../../i18n/context';
import { IconButton } from '../../shared/components/IconButton';

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
    <div className="space-y-3">
      {events.map((ev, idx) => (
        <div key={idx} className="border border-neutral-200 bg-neutral-50 p-3 rounded-lg">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-shrink-0">
              <FormLabel>{t.prepaymentEditor.rangeType}</FormLabel>
              <Select className="w-32" options={[{value:'single',label:t.prepaymentEditor.singleMonth},{value:'range',label:t.prepaymentEditor.range}]} value={ev.rangeType ?? 'single'} onChange={(v)=>update(idx,{ rangeType: v, month: ev.month ?? 6, endMonth: v === 'range' ? (ev.endMonth ?? ev.month ?? 6) : null })} />
            </div>
            {ev.rangeType === 'single' ? (
              <div className="flex-shrink-0">
                <FormLabel>{t.prepaymentEditor.month}</FormLabel>
                <FormInput type="number" className="w-20" value={ev.month ?? 6} onChange={(e) => update(idx, { month: Number(e.target.value) })} />
              </div>
            ) : (
              <>
                <div className="flex-shrink-0">
                  <FormLabel>{t.prepaymentEditor.startMonth}</FormLabel>
                  <FormInput type="number" className="w-20" value={ev.month ?? 6} onChange={(e) => update(idx, { month: Number(e.target.value) })} />
                </div>
                <div className="flex-shrink-0">
                  <FormLabel>{t.prepaymentEditor.endMonth}</FormLabel>
                  <FormInput type="number" className="w-20" value={ev.endMonth ?? ev.month ?? 6} onChange={(e) => update(idx, { endMonth: Number(e.target.value) })} />
                </div>
                <div className="flex-shrink-0">
                  <FormLabel>{t.prepaymentEditor.stepOptional}</FormLabel>
                  <FormInput type="number" className="w-20" value={ev.step ?? ''} placeholder="1" onChange={(e) => update(idx, { step: e.target.value === '' ? null : Number(e.target.value) })} />
                </div>
              </>
            )}
            <div className="flex-shrink-0">
              <FormLabel>{t.prepaymentEditor.mode}</FormLabel>
              <Select className="w-36" options={[{value:'Amount',label:t.fields.amount},{value:'ExtraInstallmentPercent',label:`${t.fields.percent} ${t.compare.installment.toLowerCase()}`}]} value={ev.type} onChange={(v)=>update(idx,{ type: v })} />
            </div>
            <div className="flex-shrink-0">
              <FormLabel>{t.prepaymentEditor.value}</FormLabel>
              <FormInput type="number" step="0.01" className="w-24" value={ev.type === 'Amount' ? ev.amount : ev.percent ?? 0} onChange={(e) => update(idx, ev.type === 'Amount' ? { amount: Number(e.target.value) } : { percent: Number(e.target.value) })} />
            </div>
            <div className="flex-shrink-0">
              <FormLabel>{t.prepaymentEditor.policy}</FormLabel>
              <Select className="w-36" options={[{value:'ReduceTerm',label:t.fields.reduceTerm},{value:'ReduceInstallment',label:t.fields.reduceInstallment}]} value={ev.policy} onChange={(v)=>update(idx,{ policy: v })} />
            </div>
            <div className="flex-shrink-0">
              <IconButton label={t.common.remove} title={t.common.remove} onClick={() => remove(idx)} className="mb-0">
                <span aria-hidden>×</span>
              </IconButton>
            </div>
          </div>
        </div>
      ))}
      <Button variant="secondary" size="xs" onClick={add}>{t.calculator.prepayments}</Button>
    </div>
  );
}

