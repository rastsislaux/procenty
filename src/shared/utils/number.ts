export function parseNumberOrUndefined(input: string): number | undefined {
  if (input.trim() === '') return undefined;
  const n = Number(input);
  return Number.isFinite(n) ? n : undefined;
}

export function clamp(value: number, min?: number, max?: number): number {
  if (min != null && value < min) return min;
  if (max != null && value > max) return max;
  return value;
}

export function roundToStep(value: number, step: number): number {
  if (!step || step <= 0) return value;
  const inv = 1 / step;
  return Math.round(value * inv) / inv;
}


