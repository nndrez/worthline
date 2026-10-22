import { chartModel, summarize } from './dashboard-summary';
import { DashboardData } from './dashboard-api';

describe('dashboard reporting', () => {
  const data: DashboardData = {
    accounts: [
      { id: 'cash', name: 'Synthetic cash', type: 'CASH' },
      { id: 'fund', name: 'Synthetic fund', type: 'INVESTMENT' },
    ],
    balances: [
      { id: 'zero', accountId: 'cash', date: '2026-01-31', amount: '0.00' },
      { id: 'previous', accountId: 'fund', date: '2025-12-31', amount: '100.00' },
    ],
    transactions: [
      { id: 'income', type: 'INCOME', amount: '0.30' },
      { id: 'expense', type: 'EXPENSE', amount: '0.10' },
    ],
  };
  it('keeps missing balances distinct from zero without carrying values forward', () => {
    const result = summarize(data, '2026-01');
    expect(result.total).toBe('0.00');
    expect(result.accounts[0].balance).toBe('0.00');
    expect(result.accounts[1].balance).toBeNull();
    expect(result.recorded).toBe(1);
    expect(result.missing).toBe(1);
    expect(result.allocation.find((group) => group.type === 'INVESTMENT')?.total).toBeNull();
    expect(result.allocation.find((group) => group.type === 'CASH')?.total).toBe('0.00');
    expect(result.cashFlow).toBe('0.20');
    expect(result.history.find((point) => point.month === '2025-11')?.total).toBeNull();
  });
  it('does not fabricate totals for a month with no snapshots', () => {
    expect(summarize({ ...data, balances: [] }, '2026-01').total).toBeNull();
    expect(chartModel(summarize({ ...data, balances: [] }, '2026-01').history)).toBeNull();
  });
  it('splits chart lines across missing months and supports negative valuations', () => {
    const model = chartModel([
      { month: '2026-01', total: '-10.00', count: 1, partial: false },
      { month: '2026-02', total: null, count: 0, partial: false },
      { month: '2026-03', total: '20.00', count: 1, partial: false },
    ]);
    expect(model?.segments.length).toBe(2);
    expect(model?.points[1].y).toBeNull();
    expect(model?.points[0].y).toBeGreaterThan(model?.points[2].y ?? 0);
  });
});
