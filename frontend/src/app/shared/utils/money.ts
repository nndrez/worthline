import Decimal from 'decimal.js';
export type DecimalValue = string | number;
const euro = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  useGrouping: true,
});

export function formatMoney(value: DecimalValue | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const [whole, fraction] = new Decimal(value).toFixed(2).split('.');
  return euro
    .formatToParts(whole === '-0' ? -0 : BigInt(whole))
    .map((part) => (part.type === 'fraction' ? fraction : part.value))
    .join('');
}

export function decimalInput(value: string, scale = 2): string | null {
  const normalized = value.trim().replace(',', '.');
  if (!new RegExp(`^-?\\d{1,${scale === 2 ? 17 : 13}}(?:\\.\\d{1,${scale}})?$`).test(normalized))
    return null;
  return new Decimal(normalized).toFixed(scale);
}

export function sumMoney(values: readonly DecimalValue[]): string {
  return values.reduce<Decimal>((sum, value) => sum.plus(value), new Decimal(0)).toFixed(2);
}
