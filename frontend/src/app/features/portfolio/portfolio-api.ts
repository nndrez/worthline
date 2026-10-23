import { inject, Injectable } from '@angular/core';
import { ApiTransport } from '../../core/http/api-transport';
import { collectPages, PageResponse, Query } from '../../core/http/page';
import {
  Instrument,
  InstrumentRequest,
  InstrumentSummary,
  Operation,
  OperationRequest,
} from './portfolio.models';

@Injectable({ providedIn: 'root' })
export class PortfolioApi {
  private readonly transport = inject(ApiTransport);
  instruments(query: Query = {}) {
    return this.transport.get<PageResponse<Instrument>>('/instruments', query);
  }
  saveInstrument(id: string | null, body: InstrumentRequest) {
    return id
      ? this.transport.put<Instrument>('/instruments/' + id, body)
      : this.transport.post<Instrument>('/instruments', body);
  }
  instrumentSummary(id: string) {
    return this.transport.get<InstrumentSummary>('/instruments/' + id + '/summary');
  }
  deleteInstrument(id: string) {
    return this.transport.delete('/instruments/' + id);
  }
  operations(query: Query = {}) {
    return this.transport.get<PageResponse<Operation>>('/investment-operations', query);
  }
  saveOperation(id: string | null, body: OperationRequest) {
    return id
      ? this.transport.put<Operation>('/investment-operations/' + id, body)
      : this.transport.post<Operation>('/investment-operations', body);
  }
  deleteOperation(id: string) {
    return this.transport.delete('/investment-operations/' + id);
  }
  instrumentOptions() {
    return collectPages((page) => this.instruments({ page, size: 100, sort: 'name,asc' }));
  }
}
