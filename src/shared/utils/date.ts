export function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}


