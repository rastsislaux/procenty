export type Rule =
  | { type: 'required' }
  | { type: 'min'; value: number }
  | { type: 'max'; value: number }
  | { type: 'decimalPlaces'; value: number };

export function validateNumber(value: number | undefined, rules: Rule[]): string[] {
  const errors: string[] = [];
  for (const r of rules) {
    if (r.type === 'required' && (value == null || Number.isNaN(value))) {
      errors.push('required');
    }
    if (r.type === 'min' && value != null && value < r.value) {
      errors.push(`min:${r.value}`);
    }
    if (r.type === 'max' && value != null && value > r.value) {
      errors.push(`max:${r.value}`);
    }
    if (r.type === 'decimalPlaces' && value != null) {
      const s = String(value);
      const parts = s.split('.');
      if (parts[1] && parts[1].length > r.value) errors.push(`decimalPlaces:${r.value}`);
    }
  }
  return errors;
}


