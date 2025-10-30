import React from 'react';
import { FieldConstraint } from '../../config/loan-templates';
import { Select } from './Select';

type ConstrainedNumberInputProps = {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  constraint?: FieldConstraint;
  step?: number;
  className?: string;
  compact?: boolean;
};

export function ConstrainedNumberInput({
  value,
  onChange,
  constraint,
  step = 0.01,
  className,
  compact = true,
}: ConstrainedNumberInputProps) {
  const defaultClassName = compact 
    ? 'mt-1 w-full rounded border px-2 py-2 text-sm' 
    : 'mt-1 w-full rounded border px-3 py-2';
  const finalClassName = className || defaultClassName;
  if (constraint?.type === 'enum') {
    return (
      <Select
        options={constraint.values.map(v => ({ value: String(v), label: String(v) }))}
        value={value != null ? String(value) : ''}
        onChange={(v) => onChange(v === '' ? undefined : Number(v))}
      />
    );
  }

  if (constraint?.type === 'range') {
    const placeholder = 
      constraint.min != null && constraint.max != null
        ? `${constraint.min} - ${constraint.max}`
        : constraint.min != null
        ? `≥ ${constraint.min}`
        : constraint.max != null
        ? `≤ ${constraint.max}`
        : undefined;

    return (
      <input
        type="number"
        min={constraint.min}
        max={constraint.max}
        step={constraint.step ?? step}
        placeholder={placeholder}
        className={finalClassName}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
    );
  }

  // No constraint or unknown type - use regular input
  return (
    <input
      type="number"
      step={step}
      className={finalClassName}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
    />
  );
}

