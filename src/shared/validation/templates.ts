import { Template } from '../../config/loan-templates';

export type GetErrorMsg = (key: string, params?: Record<string, string | number>) => string;

export function summarizeTemplateConstraints(tpl: Template): Array<{ field: string; text: string }> {
  const items: Array<{ field: string; text: string }> = [];
  const c = tpl.constraints ?? {};
  for (const [field, rule] of Object.entries(c)) {
    if (!rule) continue;
    if (rule.type === 'enum') items.push({ field, text: `Allowed: ${rule.values.join(', ')}` });
    if (rule.type === 'range')
      items.push({ field, text: `Range: ${rule.min ?? '-∞'} .. ${rule.max ?? '+∞'}${rule.step ? ` (step ${rule.step})` : ''}` });
  }
  return items;
}


