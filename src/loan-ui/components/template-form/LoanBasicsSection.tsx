import React from 'react';
import { Select } from '../../../shared/components/Select';
import { FormLabel } from '../../../shared/components/FormLabel';
import { FormInput } from '../../../shared/components/FormInput';
import { Template } from '../../../config/loan-templates';
import { useI18n } from '../../../i18n/context';

const currencies = ['USD', 'EUR', 'BYN', 'GBP'] as const;
const amortizations = ['Annuity', 'Differentiated'] as const;
const dayCounts = ['30E_360', 'Actual_365', 'Actual_Actual'] as const;

export function LoanBasicsSection({ value, onChange }: { value: Template; onChange: (tpl: Template) => void }) {
  const { t } = useI18n();
  
  function update<K extends keyof Template>(key: K, val: Template[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <FormLabel className="text-xs sm:text-sm">{t.loans.name}</FormLabel>
        <FormInput value={value.name} onChange={(e) => update('name', e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <FormLabel className="text-xs sm:text-sm">{t.loans.currency}</FormLabel>
          <Select options={currencies.map((c) => ({ value: c, label: c }))} value={value.currency ?? 'USD'} onChange={(v) => update('currency', v as any)} />
        </div>
        <div>
          <FormLabel className="text-xs sm:text-sm">{t.loans.amortization}</FormLabel>
          <Select options={amortizations.map((a) => ({ value: a, label: a }))} value={value.amortization ?? 'Annuity'} onChange={(v) => update('amortization', v as any)} />
        </div>
        <div>
          <FormLabel className="text-xs sm:text-sm">{t.loans.dayCount}</FormLabel>
          <Select options={dayCounts.map((d) => ({ value: d, label: d }))} value={value.dayCount ?? '30E_360'} onChange={(v) => update('dayCount', v as any)} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <FormLabel className="text-xs sm:text-sm">{t.loans.rate}</FormLabel>
          <FormInput type="number" step="0.01" value={value.nominalAnnualRatePercent ?? ''} onChange={(e) => update('nominalAnnualRatePercent', e.target.value === '' ? undefined : Number(e.target.value))} />
        </div>
        <div>
          <FormLabel className="text-xs sm:text-sm">{t.loans.termMonths}</FormLabel>
          <FormInput type="number" value={value.termMonths ?? ''} onChange={(e) => update('termMonths', e.target.value === '' ? undefined : Number(e.target.value))} />
        </div>
        <div>
          <FormLabel className="text-xs sm:text-sm">{t.loans.prepaymentPolicy}</FormLabel>
          <Select
            options={[
              { value: 'ReduceTerm' as const, label: t.loans.reduceTerm },
              { value: 'ReduceInstallment' as const, label: t.loans.reduceInstallment },
            ]}
            value={value.prepaymentPolicy ?? null}
            onChange={(v) => update('prepaymentPolicy', v as any)}
            placeholder={t.common.select}
          />
        </div>
      </div>
      <div>
        <FormLabel className="text-xs sm:text-sm">{t.loans.description}</FormLabel>
        <FormInput value={value.description ?? ''} onChange={(e) => update('description', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <FormLabel className="text-xs sm:text-sm">{t.loans.bankUrl}</FormLabel>
          <FormInput type="url" value={value.bankUrl ?? ''} onChange={(e) => update('bankUrl', e.target.value || undefined)} placeholder="https://example.com" />
        </div>
        <div>
          <FormLabel className="text-xs sm:text-sm">{t.loans.loanUrl}</FormLabel>
          <FormInput type="url" value={value.loanUrl ?? ''} onChange={(e) => update('loanUrl', e.target.value || undefined)} placeholder="https://example.com" />
        </div>
      </div>
    </div>
  );
}


