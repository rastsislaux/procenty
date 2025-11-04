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
  unit?: string; // Unit label to display after the input (e.g., "%", "USD", "months")
  allowEmpty?: boolean; // If true, empty input is treated as undefined (for first payment case)
};

export function NumberInput({ value, onChange, constraint, step = 0.01, className, compact = true, unit, allowEmpty = false }: NumberInputProps) {
  // Base input styles (border, padding, typography) are always applied
  const baseClassName = compact 
    ? 'mt-0.5 rounded-input border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors shadow-soft' 
    : 'mt-1 input-base';
  // Default width depending on density; consumer can override with className (e.g., w-24)
  const defaultWidth = compact ? 'w-28' : 'w-full';
  const inputClassName = `${baseClassName} ${className ?? defaultWidth}`;
  if (constraint?.type === 'enum') {
    // Use unit prop if provided, otherwise default to empty string
    const unitSuffix = unit ? ` ${unit}` : '';
    return (
      <Select
        options={constraint.values.map((v) => {
          const label = constraint.labels?.[v] 
            ? `${v}${unitSuffix} (${constraint.labels[v]})`
            : `${v}${unitSuffix}`;
          return { value: String(v), label };
        })}
        value={value != null ? String(value) : ''}
        onChange={(v: any) => onChange(v === '' ? undefined : Number(v))}
      />
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (allowEmpty && e.target.value === '') {
      onChange(undefined);
    } else {
      onChange(e.target.value === '' ? undefined : Number(e.target.value));
    }
  };

  const inputValue = allowEmpty ? (value != null ? value : '') : (value ?? '');
  
  // Add padding-right when unit is present to make room for the unit label
  const classNameWithUnit = unit ? `${inputClassName} pr-8` : inputClassName;

  if (constraint?.type === 'range') {
    const placeholder =
      constraint.min != null && constraint.max != null
        ? `${constraint.min} - ${constraint.max}`
        : constraint.min != null
        ? `≥ ${constraint.min}`
        : constraint.max != null
        ? `≤ ${constraint.max}`
        : undefined;

    const input = (
      <input
        type="number"
        min={constraint.min}
        max={constraint.max}
        step={constraint.step ?? step}
        placeholder={placeholder}
        className={classNameWithUnit}
        value={inputValue}
        onChange={handleChange}
      />
    );

    if (unit) {
      return (
        <div className="relative inline-flex items-center">
          {input}
          <span className="absolute right-3 text-sm text-neutral-500 pointer-events-none">{unit}</span>
        </div>
      );
    }
    return input;
  }

  const input = (
    <input
      type="number"
      step={step}
      className={classNameWithUnit}
      value={inputValue}
      onChange={handleChange}
    />
  );

  if (unit) {
    return (
      <div className="relative inline-flex items-center">
        {input}
        <span className="absolute right-3 text-sm text-neutral-500 pointer-events-none">{unit}</span>
      </div>
    );
  }
  return input;
}


