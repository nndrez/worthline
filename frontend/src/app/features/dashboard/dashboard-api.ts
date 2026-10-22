import { inject, Injectable } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiTransport } from '../../core/http/api-transport';
import { collectPages, PageResponse } from '../../core/http/page';
import { DecimalValue } from '../../shared/utils/money';
import { monthEnd, previousMonths } from '../../shared/utils/dates';

export interface AccountProjection {
  id: string;
  name: string;
  type: 'CASH' | 'INVESTMENT' | 'PENSION';
}
export interface BalanceProjection {
  id: string;
  accountId: string;
  date: string;
  amount: DecimalValue;
}
export interface TransactionProjection {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: DecimalValue;
}
export interface DashboardData {
  accounts: AccountProjection[];
  balances: BalanceProjection[];
  transactions: TransactionProjection[];
}

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly transport = inject(ApiTransport);

  report(month: string) {
    const first = previousMonths(month, 12)[0];
    return forkJoin({
      accounts: collectPages((page) =>
        this.transport.get<PageResponse<AccountProjection>>('/accounts', {
          page,
          size: 100,
          sort: 'name,asc',
        }),
      ),
      balances: collectPages((page) =>
        this.transport.get<PageResponse<BalanceProjection>>('/monthly-balances', {
          page,
          size: 100,
          from: first + '-01',
          to: monthEnd(month),
          sort: 'date,asc',
        }),
      ),
      transactions: collectPages((page) =>
        this.transport.get<PageResponse<TransactionProjection>>('/transactions', {
          page,
          size: 100,
          from: month + '-01',
          to: monthEnd(month),
        }),
      ),
    });
  }
}
