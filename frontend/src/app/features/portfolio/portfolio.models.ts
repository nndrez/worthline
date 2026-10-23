import { DecimalValue } from '../../shared/utils/money';
export type OperationType = 'BUY' | 'SELL' | 'DIVIDEND';
export interface Instrument {
  id: string;
  code: string;
  name: string;
  isin: string | null;
  ticker: string | null;
}
export type InstrumentRequest = Omit<Instrument, 'id'>;
export interface Operation {
  id: string;
  instrumentId: string;
  date: string;
  type: OperationType;
  market: string | null;
  broker: string | null;
  unitPrice: DecimalValue | null;
  quantity: DecimalValue | null;
  amount: DecimalValue;
  currency: 'EUR';
  notes: string | null;
}
export interface OperationRequest {
  instrumentId: string;
  date: string;
  type: OperationType;
  market: string | null;
  broker: string | null;
  unitPrice: string | null;
  quantity: string | null;
  amount: string;
  notes: string | null;
}

export interface InstrumentSummary {
  instrument: Instrument;
  currency: 'EUR';
  operationCount: number;
  purchases: DecimalValue;
  sales: DecimalValue;
  dividends: DecimalValue;
  quantity: DecimalValue;
}
