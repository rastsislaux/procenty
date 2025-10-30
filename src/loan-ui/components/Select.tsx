import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { useI18n } from '../../i18n/context';

export type Option<T> = { value: T; label: string };

type Props<T> = {
  options: Option<T>[];
  value: T | T[] | null;
  onChange: (v: T | T[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
  getKey?: (v: T) => string | number;
};

export function Select<T>({ options, value, onChange, multiple, placeholder, className, getKey }: Props<T>) {
  const { t } = useI18n();
  
  return (
    <Listbox value={value as any} onChange={onChange as any} multiple={multiple}>
      <div className={`relative ${className ?? ''}`}>
        <Listbox.Button className="w-full rounded border bg-white px-2 py-2 text-sm text-left">
          {renderButtonLabel(options, value, placeholder, getKey, t)}
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {options.map((opt, idx) => (
              <Listbox.Option key={idx} value={opt.value} className={({ active }) => `cursor-pointer select-none px-3 py-2 ${active ? 'bg-gray-50' : ''}`}>
                {opt.label}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
}

function renderButtonLabel<T>(options: Option<T>[], value: T | T[] | null, placeholder: string | undefined, getKey: ((v: T) => string | number) | undefined, t: any) {
  const defaultPlaceholder = placeholder ?? t.common.select;
  if (value == null || (Array.isArray(value) && value.length === 0)) return defaultPlaceholder;
  if (Array.isArray(value)) {
    const labels = value.map((v) => findOption(options, v, getKey)?.label ?? '').filter(Boolean);
    return t.common.selected.replace('{count}', String(labels.length));
  }
  const found = findOption(options, value, getKey);
  return found?.label ?? defaultPlaceholder;
}

function findOption<T>(options: Option<T>[], v: T, getKey?: (v: T) => string | number) {
  if (!getKey) return options.find((o) => o.value === v);
  const key = getKey(v);
  return options.find((o) => getKey(o.value) === key);
}


