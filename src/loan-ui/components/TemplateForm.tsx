import React, { useState } from 'react';
import { Template } from '../../config/loan-templates';
import { LoanBasicsSection } from './template-form/LoanBasicsSection';
import { GraceSection } from './template-form/GraceSection';
import { FlagsSection } from './template-form/FlagsSection';
import { Button } from '../../shared/components/Button';
import { useI18n } from '../../i18n/context';

type Props = {
  value: Template;
  onChange: (tpl: Template) => void;
  onSubmit?: () => void;
};

const currencies = ['USD', 'EUR', 'BYN', 'GBP'] as const;
const amortizations = ['Annuity', 'Differentiated'] as const;
const dayCounts = ['30E_360', 'Actual_365', 'Actual_Actual'] as const;

export function TemplateForm({ value, onChange, onSubmit }: Props) {
  const { t } = useI18n();
  const [openGrace, setOpenGrace] = useState(!!value.grace);
  return (
    <form className="space-y-3 sm:space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}>
      <LoanBasicsSection value={value} onChange={onChange} />
      <GraceSection value={value} open={openGrace} onToggle={setOpenGrace} onChange={onChange} />
      <FlagsSection value={value} onChange={onChange} />
      <div className="pt-2">
        <Button type="submit" className="w-full sm:w-auto">{t.common.save}</Button>
      </div>
    </form>
  );
}

