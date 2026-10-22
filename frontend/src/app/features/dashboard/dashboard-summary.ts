import Decimal from 'decimal.js';
import { sumMoney } from '../../shared/utils/money';
import { monthEnd, previousMonths } from '../../shared/utils/dates';
import { DashboardData } from './dashboard-api';

export function summarize(data: DashboardData, month: string) {
  const balances = data.balances.filter((balance) => balance.date === monthEnd(month));
  const income = sumMoney(
    data.transactions
      .filter((transaction) => transaction.type === 'INCOME')
      .map((transaction) => transaction.amount),
  );
  const expenses = sumMoney(
    data.transactions
      .filter((transaction) => transaction.type === 'EXPENSE')
      .map((transaction) => transaction.amount),
  );
  const accounts = data.accounts.map((account) => ({
    ...account,
    balance: balances.find((balance) => balance.accountId === account.id)?.amount ?? null,
  }));
  const types = ['CASH', 'INVESTMENT', 'PENSION'] as const;
  let offset = 0;
  const total = balances.length ? sumMoney(balances.map((balance) => balance.amount)) : null;
  const groups = types.map((type) => {
    const matching = accounts.filter((account) => account.type === type);
    const recorded = matching.flatMap((account) =>
      account.balance === null ? [] : [account.balance],
    );
    return { type, total: matching.length && !recorded.length ? null : sumMoney(recorded) };
  });
  const allocationAvailable =
    total !== null &&
    new Decimal(total).gt(0) &&
    groups.every((group) => group.total === null || new Decimal(group.total).gte(0));
  const allocation = groups.map((group) => {
    const fraction =
      allocationAvailable && group.total !== null
        ? new Decimal(group.total).div(total!).mul(100).toNumber()
        : 0;
    const start = offset;
    offset += fraction;
    return {
      ...group,
      fraction,
      offset: -start,
      dash: `${fraction} ${100 - fraction}`,
      color: `var(--chart-${group.type.toLowerCase()})`,
    };
  });
  const history = previousMonths(month, 12).map((period) => {
    const entries = data.balances.filter((balance) => balance.date === monthEnd(period));
    return {
      month: period,
      total: entries.length ? sumMoney(entries.map((entry) => entry.amount)) : null,
      count: entries.length,
      partial: entries.length > 0 && entries.length < data.accounts.length,
    };
  });
  return {
    total,
    income,
    expenses,
    cashFlow: new Decimal(income).minus(expenses).toFixed(2),
    accounts,
    allocation,
    allocationAvailable,
    recorded: balances.length,
    missing: data.accounts.length - balances.length,
    history,
  };
}

export type Summary = ReturnType<typeof summarize>;

export function chartModel(history: Summary['history']) {
  const totals = history.flatMap((point) =>
    point.total === null ? [] : [new Decimal(point.total)],
  );
  if (!totals.length) return null;
  const min = Decimal.min(0, ...totals);
  const max = Decimal.max(1, ...totals);
  const range = max.minus(min);
  const points = history.map((point, index) => ({
    ...point,
    x: 65 + (index / Math.max(1, history.length - 1)) * 700,
    y: point.total === null ? null : 20 + max.minus(point.total).div(range).mul(170).toNumber(),
    label: new Intl.DateTimeFormat('it-IT', { month: 'short', timeZone: 'UTC' }).format(
      new Date(point.month + '-01T12:00:00Z'),
    ),
  }));
  const segments: { line: string; area: string }[] = [];
  let current: typeof points = [];
  const flush = () => {
    if (!current.length) return;
    const line = current
      .map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`)
      .join(' ');
    segments.push({
      line,
      area: `${line} L${current[current.length - 1].x},194 L${current[0].x},194 Z`,
    });
    current = [];
  };
  for (const point of points) {
    if (point.y === null) flush();
    else current.push(point);
  }
  flush();
  const ticks = Array.from({ length: 4 }, (_, index) => ({
    y: 20 + (index / 3) * 170,
    label:
      new Intl.NumberFormat('it-IT', { notation: 'compact', maximumFractionDigits: 0 }).format(
        max.minus(range.mul(index).div(3)).toNumber(),
      ) + ' €',
  }));
  return { points, segments, ticks };
}
