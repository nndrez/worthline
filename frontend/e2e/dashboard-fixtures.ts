import Decimal from 'decimal.js';
import type { TestStore } from './mocked-api';

/** Synthetic server responses for browser workflows; financial rules are tested against PostgreSQL. */
export function dashboardFixture(url: URL, store: TestStore): unknown {
  const month = url.searchParams.get('month') || '2026-10';
  const end = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
  const date = `${month}-${end}`;
  const accounts = store['accounts'];
  const balances = store['monthly-balances'].filter((row) => row['date'] === date);
  const sum = (values: unknown[]) =>
    values.reduce<Decimal>((total, value) => total.plus(String(value)), new Decimal(0)).toFixed(2);
  const total = balances.length ? sum(balances.map((row) => row['amount'])) : null;
  const recorded = balances.length;
  const latest = accounts.flatMap((account) => {
    const entries = store['monthly-balances']
      .filter((row) => row['accountId'] === account.id && String(row['date']) <= date)
      .sort((a, b) => String(b['date']).localeCompare(String(a['date'])));
    return entries.length ? [entries[0]] : [];
  });
  const latestTotal = latest.length ? sum(latest.map((row) => row['amount'])) : null;

  switch (url.pathname.split('/').at(-1)) {
    case 'wealth': {
      const periods = Number(url.searchParams.get('periods') || 6);
      return {
        month,
        currency: 'EUR',
        total,
        missing: accounts.length - recorded,
        history: Array.from({ length: periods }, (_, index) => {
          const period = new Date(
            Number(month.slice(0, 4)),
            Number(month.slice(5)) - periods + index,
            1,
          );
          const key = `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, '0')}`;
          const entries = store['monthly-balances'].filter((row) =>
            String(row['date']).startsWith(key),
          );
          return {
            month: key,
            total: entries.length ? sum(entries.map((row) => row['amount'])) : null,
            count: entries.length,
            partial: entries.length > 0 && entries.length < accounts.length,
            groups: ['CASH', 'INVESTMENT', 'PENSION']
              .filter((type) => accounts.some((account) => account['type'] === type))
              .map((type) => {
                const typed = accounts.filter((account) => account['type'] === type);
                const values = entries.filter((entry) =>
                  typed.some((account) => account.id === entry['accountId']),
                );
                return {
                  type,
                  total: values.length ? sum(values.map((value) => value['amount'])) : null,
                  count: values.length,
                  partial: values.length > 0 && values.length < typed.length,
                };
              }),
          };
        }),
      };
    }
    case 'allocation': {
      const balances = latest;
      const total = latestTotal;
      const groups = ['CASH', 'INVESTMENT', 'PENSION']
        .filter((type) => accounts.some((account) => account['type'] === type))
        .map((type) => {
          const ids = accounts
            .filter((account) => account['type'] === type)
            .map((account) => account.id);
          const entries = balances.filter((balance) => ids.includes(String(balance['accountId'])));
          const amount = entries.length ? sum(entries.map((entry) => entry['amount'])) : null;
          return {
            type,
            total: amount,
            percentage:
              total && new Decimal(total).gt(0) && amount
                ? new Decimal(amount).div(total).mul(100).toFixed(2)
                : '0.00',
          };
        });
      return {
        month,
        currency: 'EUR',
        total,
        available:
          total !== null &&
          new Decimal(total).gt(0) &&
          groups.every((group) => group.total === null || new Decimal(group.total).gte(0)),
        groups,
      };
    }
    case 'current-situation': {
      const content = [...accounts]
        .sort((a, b) => String(a['name']).localeCompare(String(b['name'])))
        .map((account) => {
          const value = latest.find((balance) => balance['accountId'] === account.id);
          return {
            ...account,
            currency: 'EUR',
            balance: value?.['amount'] ?? null,
            date: value?.['date'] ?? null,
          };
        });
      return {
        currency: 'EUR',
        total: latestTotal,
        missing: accounts.length - latest.length,
        month,
        accounts: content,
      };
    }
    default: {
      const metric = (period: string) => {
        const entries = store['transactions'].filter((row) =>
          String(row['date']).startsWith(period),
        );
        const income = sum(
          entries.filter((row) => row['type'] === 'INCOME').map((row) => row['amount']),
        );
        const expenses = sum(
          entries.filter((row) => row['type'] === 'EXPENSE').map((row) => row['amount']),
        );
        return {
          month: period,
          transactionCount: url.pathname.endsWith('/income')
            ? entries.filter((row) => row['type'] === 'INCOME').length
            : url.pathname.endsWith('/expenses')
              ? entries.filter((row) => row['type'] === 'EXPENSE').length
              : entries.length,
          amount: url.pathname.endsWith('/income')
            ? income
            : url.pathname.endsWith('/expenses')
              ? expenses
              : new Decimal(income).minus(expenses).toFixed(2),
        };
      };
      return {
        ...metric(month),
        comparison:
          month === '2026-10'
            ? null
            : {
                ...metric('2026-10'),
                difference:
                  metric('2026-10').transactionCount && metric(month).transactionCount
                    ? new Decimal(metric('2026-10').amount).minus(metric(month).amount).toFixed(2)
                    : null,
              },
        currency: 'EUR',
        history: Array.from({ length: 12 }, (_, index) =>
          metric(month.slice(0, 4) + '-' + String(index + 1).padStart(2, '0')),
        ),
      };
    }
  }
}
