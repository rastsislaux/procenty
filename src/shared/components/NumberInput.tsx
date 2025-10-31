import React from 'react';
import { FieldConstraint } from '../../config/loan-templates';
import { Select } from './Select';

type NumberInputProps = {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  constraint?: FieldConstraint;
  step?: number;
  className?: string;
  compact?: boolean;
};

export function NumberInput({ value, onChange, constraint, step = 0.01, className, compact = true }: NumberInputProps) {
  // Base input styles (border, padding, typography) are always applied
  const baseClassName = compact 
    ? 'mt-0.5 rounded-input border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors shadow-soft' 
    : 'mt-1 input-base';
  // Default width depending on density; consumer can override with className (e.g., w-24)
  const defaultWidth = compact ? 'w-28' : 'w-full';
  const finalClassName = `${baseClassName} ${className ?? defaultWidth}`;
  if (constraint?.type === 'enum') {
    return (
      <Select
        options={constraint.values.map((v) => ({ value: String(v), label: String(v) }))}
        value={value != null ? String(value) : ''}
        onChange={(v: any) => onChange(v === '' ? undefined : Number(v))}
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


