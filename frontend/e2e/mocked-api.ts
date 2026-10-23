import Decimal from 'decimal.js';
import { Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { dashboardFixture } from './dashboard-fixtures';

export interface TestEntity {
  id: string;
  [key: string]: unknown;
}
export type TestStore = Record<string, TestEntity[]>;
export function fixtures(): TestStore {
  const accounts = [
    { id: 'a1', name: 'Conto quotidiano', type: 'CASH' },
    { id: 'a2', name: 'Conto risparmio', type: 'CASH' },
    { id: 'a3', name: 'Portafoglio investimenti', type: 'INVESTMENT' },
    { id: 'a4', name: 'Fondo pensione', type: 'PENSION' },
  ];
  const balances: TestEntity[] = [];
  for (let month = 5; month <= 10; month++) {
    const date = `2026-${String(month).padStart(2, '0')}-${month === 6 || month === 9 ? 30 : 31}`;
    const amounts = [
      String(3400 + month * 120),
      String(11000 + month * 300),
      String(21800 + month * 750),
      String(7500 + month * 160),
    ];
    accounts.forEach((account, index) =>
      balances.push({
        id: `b${month}-${index}`,
        accountId: account.id,
        date,
        amount: amounts[index] + '.50',
        currency: 'EUR',
      }),
    );
  }
  return {
    accounts,
    'monthly-balances': balances,
    categories: [
      { id: 'c1', name: 'Casa e quotidianità', type: 'EXPENSE', parentId: null },
      { id: 'c2', name: 'Spesa alimentare', type: 'EXPENSE', parentId: 'c1' },
      { id: 'c3', name: 'Reddito da lavoro', type: 'INCOME', parentId: null },
    ],
    transactions: [
      {
        id: 't1',
        date: '2026-10-10',
        description: 'Stipendio',
        amount: '2800.00',
        currency: 'EUR',
        type: 'INCOME',
        categoryId: 'c3',
        tag: null,
        notes: null,
      },
      {
        id: 't2',
        date: '2026-10-14',
        description: 'Spesa settimanale',
        amount: '82.30',
        currency: 'EUR',
        type: 'EXPENSE',
        categoryId: 'c2',
        tag: 'Quotidianità',
        notes: null,
      },
      {
        id: 't3',
        date: '2026-10-15',
        description: 'Utenze di casa',
        amount: '168.40',
        currency: 'EUR',
        type: 'EXPENSE',
        categoryId: 'c1',
        tag: null,
        notes: null,
      },
    ],
    instruments: [
      { id: 'i1', code: 'GLOBAL', name: 'Fondo globale di esempio', isin: null, ticker: 'GLOBAL' },
    ],
    'investment-operations': [
      {
        id: 'o1',
        instrumentId: 'i1',
        date: '2026-10-15',
        type: 'BUY',
        unitPrice: '125.50',
        quantity: '2.000000',
        amount: '251.00',
        currency: 'EUR',
        market: 'Mercato di esempio',
        broker: 'Intermediario di prova',
        notes: null,
      },
    ],
  };
}

export async function mockApi(page: Page, store = fixtures()): Promise<TestStore> {
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const [, , resource, id] = url.pathname.split('/');
    const rows = store[resource];
    const respond = (body: unknown, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (resource === 'dashboard') return respond(dashboardFixture(url, store));
    if (!rows) return respond({ errorCode: 'common.http.error' }, 404);
    const method = route.request().method();
    if (method === 'GET' && resource === 'instruments' && url.pathname.endsWith('/summary')) {
      const operations = store['investment-operations'].filter((row) => row['instrumentId'] === id);
      const sum = (type: string) =>
        operations
          .filter((row) => row['type'] === type)
          .reduce((total, row) => total.plus(String(row['amount'])), new Decimal(0))
          .toFixed(2);
      return respond({
        instrument: rows.find((row) => row.id === id),
        currency: 'EUR',
        operationCount: operations.length,
        purchases: sum('BUY'),
        sales: sum('SELL'),
        dividends: sum('DIVIDEND'),
        quantity: operations
          .reduce(
            (total, row) =>
              row['type'] === 'DIVIDEND'
                ? total
                : total.plus(
                    new Decimal(String(row['quantity'])).mul(row['type'] === 'BUY' ? 1 : -1),
                  ),
            new Decimal(0),
          )
          .toFixed(6),
      });
    }
    if (method === 'GET') {
      if (id)
        return respond(
          rows.find((row) => row.id === id),
          rows.some((row) => row.id === id) ? 200 : 404,
        );
      let content = [...rows];
      for (const [key, value] of url.searchParams) {
        if (['page', 'size', 'sort'].includes(key)) continue;
        if (key === 'from') content = content.filter((row) => String(row['date']) >= value);
        else if (key === 'to') content = content.filter((row) => String(row['date']) <= value);
        else if (key === 'rootOnly') content = content.filter((row) => !row['parentId']);
        else if (
          ['name', 'description', 'broker', 'market', 'code', 'isin', 'ticker', 'tag'].includes(key)
        )
          content = content.filter((row) =>
            String(row[key] || '')
              .toLowerCase()
              .includes(value.toLowerCase()),
          );
        else content = content.filter((row) => String(row[key]) === value);
      }
      const [field, direction] = (url.searchParams.get('sort') || 'id,asc').split(',');
      content.sort(
        (a, b) =>
          String(a[field] || '').localeCompare(String(b[field] || ''), 'it') *
          (direction === 'desc' ? -1 : 1),
      );
      const index = Number(url.searchParams.get('page') || 0);
      const size = Number(url.searchParams.get('size') || 20);
      return respond({
        content: content.slice(index * size, (index + 1) * size),
        page: {
          currentPage: index + 1,
          size,
          totalElements: content.length,
          totalPages: Math.ceil(content.length / size),
          first: index === 0,
          last: (index + 1) * size >= content.length,
        },
      });
    }
    if (method === 'DELETE') {
      if (
        resource === 'accounts' &&
        store['monthly-balances'].some((row) => row['accountId'] === id)
      )
        return respond({ errorCode: 'account.in.use' }, 409);
      store[resource] = rows.filter((row) => row.id !== id);
      return route.fulfill({ status: 204 });
    }
    const body = route.request().postDataJSON() as Record<string, unknown>;
    if (
      body['name'] &&
      rows.some(
        (row) =>
          row.id !== id &&
          String(row['name']).trim().toLowerCase() === String(body['name']).trim().toLowerCase(),
      )
    )
      return respond({ errorCode: 'common.resource.conflict' }, 409);
    const entity: TestEntity = { ...body, id: id || randomUUID() };
    if ('amount' in body) entity['currency'] = 'EUR';
    if (id) store[resource] = rows.map((row) => (row.id === id ? entity : row));
    else rows.push(entity);
    return respond(entity, id ? 200 : 201);
  });
  return store;
}
