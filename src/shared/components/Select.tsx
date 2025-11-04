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
        <Listbox.Button className="w-full rounded-input border border-neutral-300 bg-white px-3 py-2.5 text-sm text-left text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors shadow-soft">
          {renderButtonLabel(options, value, placeholder, getKey, t)}
        </Listbox.Button>
        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
          {/* Use anchored options so the dropdown is portaled and not clipped by overflow-hidden parents */}
          <Listbox.Options
            anchor="bottom start"
            className="z-50 mt-1 max-h-60 w-[var(--anchor-width)] overflow-auto rounded-lg bg-white py-1 shadow-large ring-1 ring-neutral-200 focus:outline-none"
          >
            {options.map((opt, idx) => {
              // Check if label contains a comment in format "value (comment)"
              const commentMatch = opt.label.match(/^(.+?)\s*\((.+?)\)$/);
              const mainLabel = commentMatch ? commentMatch[1] : opt.label;
              const comment = commentMatch ? commentMatch[2] : null;
              
              return (
                <Listbox.Option key={idx} value={opt.value} className={({ active }) => `cursor-pointer select-none px-3 py-2.5 text-sm transition-colors ${active ? 'bg-primary-50 text-primary-900' : 'text-neutral-900'}`}>
                  <div className="flex flex-col">
                    <span>{mainLabel}</span>
                    {comment && (
                      <span className="text-xs text-neutral-500 mt-0.5">{comment}</span>
                    )}
                  </div>
                </Listbox.Option>
              );
            })}
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
  if (!found) return defaultPlaceholder;
  
  // Strip comment from label for button display (format: "value (comment)")
  const commentMatch = found.label.match(/^(.+?)\s*\((.+?)\)$/);
  return commentMatch ? commentMatch[1] : found.label;
}

function findOption<T>(options: Option<T>[], v: T, getKey?: (v: T) => string | number) {
  if (!getKey) return options.find((o) => o.value === v);
  const key = getKey(v);
  return options.find((o) => getKey(o.value) === key);
}


