import { inject, Injectable } from '@angular/core';
import { ApiTransport } from '../../core/http/api-transport';
import { collectPages, PageResponse, Query } from '../../core/http/page';
import { Transaction, TransactionRequest, CategoryOption } from './transactions.models';

@Injectable({ providedIn: 'root' })
export class TransactionsApi {
  private readonly transport = inject(ApiTransport);
  transactions(query: Query = {}) {
    return this.transport.get<PageResponse<Transaction>>('/transactions', query);
  }
  saveTransaction(id: string | null, body: TransactionRequest) {
    return id
      ? this.transport.put<Transaction>('/transactions/' + id, body)
      : this.transport.post<Transaction>('/transactions', body);
  }
  deleteTransaction(id: string) {
    return this.transport.delete('/transactions/' + id);
  }
  categoryOptions() {
    return collectPages((page) =>
      this.transport.get<PageResponse<CategoryOption>>('/categories', {
        page,
        size: 100,
        sort: 'name,asc',
      }),
    );
  }
}
