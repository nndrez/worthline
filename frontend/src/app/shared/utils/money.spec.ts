import { decimalInput, formatMoney, sumMoney } from './money';
import { monthEnd, previousMonths } from './dates';

describe('financial values', () => {
  it('preserves cents and large values without floating point arithmetic', () => {
    expect(sumMoney(['0.10', '0.20'])).toBe('0.30');
    expect(sumMoney(['99999999999999999.99', '-0.01'])).toBe('99999999999999999.98');
    expect(formatMoney('99999999999999999.99')).toContain('99.999.999.999.999.999,99');
    expect(formatMoney('-0.01')).toContain('-0,01');
  });
  it('distinguishes missing values from recorded zero', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney('0')).toContain('0,00');
  });
  it('accepts Italian decimal input and rejects excess precision and exponential input', () => {
    expect(decimalInput(' 12,30 ')).toBe('12.30');
    expect(decimalInput('-12,30')).toBe('-12.30');
    expect(decimalInput('1.123456', 6)).toBe('1.123456');
    for (const value of ['1.001', '1e3', 'Infinity', 'NaN', '', '12.000,30'])
      expect(decimalInput(value)).toBeNull();
  });
  it('handles month ends and year boundaries without timezone conversions', () => {
    expect(monthEnd('2024-02')).toBe('2024-02-29');
    expect(monthEnd('2026-02')).toBe('2026-02-28');
    expect(previousMonths('2026-02', 3)).toEqual(['2025-12', '2026-01', '2026-02']);
  });
});
