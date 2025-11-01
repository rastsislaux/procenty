import React from 'react';
import { Switch } from '@headlessui/react';
import { Template } from '../../../config/loan-templates';
import { clsx } from 'clsx';
import { SectionContainer } from '../../../shared/components/SectionContainer';
import { useI18n } from '../../../i18n/context';

export function FlagsSection({ value, onChange }: { value: Template; onChange: (tpl: Template) => void }) {
  const { t } = useI18n();
  
  function update<K extends keyof Template>(key: K, val: Template[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <SectionContainer>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="font-medium flex-1">{t.templates.allowFirstPayment}</div>
          <Switch checked={!!value.allowFirstPayment} onChange={(v) => update('allowFirstPayment', v as any)} className={clsx('relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0', value.allowFirstPayment ? 'bg-blue-600' : 'bg-gray-300')}>
            <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-white transition', value.allowFirstPayment ? 'translate-x-6' : 'translate-x-1')} />
          </Switch>
        </div>
        <div className="flex items-center justify-between">
          <div className="font-medium flex-1">{t.templates.allowPrepayments}</div>
          <Switch checked={!!value.prepaymentsAllowed} onChange={(v) => update('prepaymentsAllowed', v as any)} className={clsx('relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0', value.prepaymentsAllowed ? 'bg-blue-600' : 'bg-gray-300')}>
            <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-white transition', value.prepaymentsAllowed ? 'translate-x-6' : 'translate-x-1')} />
          </Switch>
        </div>
      </div>
    </SectionContainer>
  );
}


