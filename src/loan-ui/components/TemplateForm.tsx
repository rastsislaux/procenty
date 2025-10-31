import React, { useState } from 'react';
import { Template } from '../../config/loan-templates';
import { LoanBasicsSection } from './template-form/LoanBasicsSection';
import { GraceSection } from './template-form/GraceSection';
import { FlagsSection } from './template-form/FlagsSection';

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
  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}>
      <LoanBasicsSection value={value} onChange={onChange} />
      <GraceSection value={value} open={openGrace} onToggle={setOpenGrace} onChange={onChange} />
      <FlagsSection value={value} onChange={onChange} />
      <div className="pt-2">
        <button className="px-4 py-2 rounded bg-blue-600 text-white" type="submit">Save</button>
      </div>
    </form>
  );
}

