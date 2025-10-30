export function daysInMonth(year: number, month0: number): number {
  // month0 is 0-based
  return new Date(year, month0 + 1, 0).getDate();
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function toDate(value?: Date | string): Date | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
}

