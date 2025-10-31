import React from 'react';
import { Switch } from '@headlessui/react';
import { Template } from '../../../config/loan-templates';
import { clsx } from 'clsx';

export function FlagsSection({ value, onChange }: { value: Template; onChange: (tpl: Template) => void }) {
  function update<K extends keyof Template>(key: K, val: Template[K]) {
    onChange({ ...value, [key]: val });
  }

  return (
    <div className="border rounded p-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3">
          <div className="font-medium">Allow first payment</div>
          <Switch checked={!!value.allowFirstPayment} onChange={(v) => update('allowFirstPayment', v as any)} className={clsx('relative inline-flex h-6 w-11 items-center rounded-full', value.allowFirstPayment ? 'bg-blue-600' : 'bg-gray-300')}>
            <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-white transition', value.allowFirstPayment ? 'translate-x-6' : 'translate-x-1')} />
          </Switch>
        </div>
        <div className="flex items-center gap-3">
          <div className="font-medium">Allow prepayments</div>
          <Switch checked={!!value.prepaymentsAllowed} onChange={(v) => update('prepaymentsAllowed', v as any)} className={clsx('relative inline-flex h-6 w-11 items-center rounded-full', value.prepaymentsAllowed ? 'bg-blue-600' : 'bg-gray-300')}>
            <span className={clsx('inline-block h-4 w-4 transform rounded-full bg-white transition', value.prepaymentsAllowed ? 'translate-x-6' : 'translate-x-1')} />
          </Switch>
        </div>
      </div>
    </div>
  );
}


