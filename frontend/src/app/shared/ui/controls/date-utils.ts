import { format, isValid, parseISO } from 'date-fns';

export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseIsoDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : parseISO(value);
  return isValid(date) ? date : null;
}
