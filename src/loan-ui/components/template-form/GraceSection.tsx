import React from 'react';
import { Switch } from '@headlessui/react';
import { Template } from '../../../config/loan-templates';
import { clsx } from 'clsx';
import { SectionContainer } from '../../../shared/components/SectionContainer';
import { FormLabel } from '../../../shared/components/FormLabel';
import { FormInput } from '../../../shared/components/FormInput';
import { Select } from '../../../shared/components/Select';
import { useI18n } from '../../../i18n/context';

export function GraceSection({ value, open, onToggle, onChange }: { value: Template; open: boolean; onToggle: (v: boolean) => void; onChange: (tpl: Template) => void }) {
  const { t } = useI18n();
  
  function updateGrace<K extends keyof NonNullable<Template['grace']>>(key: K, val: NonNullable<Template['grace']>[K]) {
    if (!value.grace) return;
    onChange({ ...value, grace: { ...value.grace, [key]: val } as any });
  }

  const graceTypeOptions = [
    { value: 'InterestOnly' as const, label: t.templates.interestOnly },
    { value: 'ReducedRate' as const, label: t.templates.reducedRateType },
  ];

  return (
    <SectionContainer>
      <div className="flex items-center justify-between">
        <div className="font-medium">{t.templates.gracePeriod}</div>
        <Switch checked={open} onChange={(v) => { onToggle(v); if (!v) onChange({ ...value, grace: undefined }); else onChange({ ...value, grace: { type: 'InterestOnly', months: 3 } as any }); }} className={clsx('relative inline-flex h-6 w-11 items-center rounded-full', open ? 'bg-blue-600' : 'bg-gray-300')}>
          <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-white transition', open ? 'translate-x-6' : 'translate-x-1')} />
        </Switch>
      </div>
      {open && value.grace && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3 items-end">
          <div>
            <FormLabel className="text-sm">{t.templates.graceType}</FormLabel>
            <Select
              options={graceTypeOptions}
              value={value.grace.type}
              onChange={(v) => onChange({ ...value, grace: { ...value.grace!, type: v as any } })}
            />
          </div>
          <div>
            <FormLabel className="text-sm">{t.templates.graceMonths}</FormLabel>
            <FormInput type="number" className="w-24" value={value.grace.months} onChange={(e) => updateGrace('months', Number(e.target.value))} />
          </div>
          {value.grace.type === 'ReducedRate' && (
            <div>
              <FormLabel className="text-sm">{t.templates.reducedRate}</FormLabel>
              <FormInput type="number" step="0.01" className="w-28" value={value.grace.reducedAnnualRatePercent ?? 0} onChange={(e) => updateGrace('reducedAnnualRatePercent', Number(e.target.value))} />
            </div>
          )}
        </div>
      )}
    </SectionContainer>
  );
}


