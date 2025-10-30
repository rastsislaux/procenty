import React from 'react';
import { FieldConstraint, Template } from '../../config/loan-templates';

export function ConstraintsInfo({ t }: { t: Template }) {
  const items: Array<{ field: string; text: string }> = [];
  const c = t.constraints ?? {};
  for (const [field, rule] of Object.entries(c)) {
    if (!rule) continue;
    if (rule.type === 'enum') items.push({ field, text: `Allowed: ${rule.values.join(', ')}` });
    if (rule.type === 'range') items.push({ field, text: `Range: ${rule.min ?? '-∞'} .. ${rule.max ?? '+∞'}${rule.step ? ` (step ${rule.step})` : ''}` });
  }
  if (items.length === 0) return null;
  return (
    <div className="text-xs text-gray-600 space-y-1">
      {items.map((it) => (
        <div key={it.field}>• {it.field}: {it.text}</div>
      ))}
    </div>
  );
}

