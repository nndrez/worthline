import { inject, Injectable } from '@angular/core';
import { ApiTransport } from '../../core/http/api-transport';
import { collectPages, PageResponse, Query } from '../../core/http/page';
import { Account, AccountRequest, BalanceRequest, MonthlyBalance } from './wealth.models';

@Injectable({ providedIn: 'root' })
export class WealthApi {
  private readonly transport = inject(ApiTransport);
  accounts(query: Query = {}) {
    return this.transport.get<PageResponse<Account>>('/accounts', query);
  }
  saveAccount(id: string | null, body: AccountRequest) {
    return id
      ? this.transport.put<Account>('/accounts/' + id, body)
      : this.transport.post<Account>('/accounts', body);
  }
  deleteAccount(id: string) {
    return this.transport.delete('/accounts/' + id);
  }
  balances(query: Query = {}) {
    return this.transport.get<PageResponse<MonthlyBalance>>('/monthly-balances', query);
  }
  saveMonthlyBalance(id: string | null, body: BalanceRequest) {
    return id
      ? this.transport.put<MonthlyBalance>('/monthly-balances/' + id, body)
      : this.transport.post<MonthlyBalance>('/monthly-balances', body);
  }
  deleteMonthlyBalance(id: string) {
    return this.transport.delete('/monthly-balances/' + id);
  }
  accountOptions() {
    return collectPages((page) => this.accounts({ page, size: 100, sort: 'name,asc' }));
  }
}
