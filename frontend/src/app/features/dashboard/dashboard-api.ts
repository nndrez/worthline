import { inject, Injectable } from '@angular/core';
import { ApiTransport } from '../../core/http/api-transport';
import { DecimalValue } from '../../shared/utils/money';

export interface HistoryGroup {
  type: 'CASH' | 'INVESTMENT' | 'PENSION';
  total: DecimalValue | null;
  count: number;
  partial: boolean;
}
export interface HistoryPoint {
  groups: HistoryGroup[];
  month: string;
  total: DecimalValue | null;
  count: number;
  partial: boolean;
}
export interface WealthCard {
  month: string;
  currency: 'EUR';
  total: DecimalValue | null;
  missing: number;
  history: HistoryPoint[];
}
export interface AllocationGroup {
  type: 'CASH' | 'INVESTMENT' | 'PENSION';
  total: DecimalValue | null;
  percentage: DecimalValue;
}
export interface AllocationCard {
  month: string;
  currency: 'EUR';
  total: DecimalValue | null;
  available: boolean;
  groups: AllocationGroup[];
}
export interface MetricPoint {
  month: string;
  amount: DecimalValue;
  transactionCount: number;
}
export interface MonthComparisonValue {
  month: string;
  amount: DecimalValue | null;
  difference: DecimalValue | null;
}
export interface MetricCard {
  comparison: (MonthComparisonValue & { transactionCount: number }) | null;
  history: MetricPoint[];
  month: string;
  currency: 'EUR';
  amount: DecimalValue;
  transactionCount: number;
}
export interface CurrentSituation {
  comparison: (MonthComparisonValue & { missing: number }) | null;
  month: string;
  currency: 'EUR';
  total: DecimalValue | null;
  missing: number;
  accounts: AccountBalance[];
}
export interface AccountBalance {
  id: string;
  name: string;
  type: 'CASH' | 'INVESTMENT' | 'PENSION';
  balance: DecimalValue | null;
  date: string | null;
  currency: 'EUR';
}
export type MetricKind = 'income' | 'expenses' | 'cash-flow';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly transport = inject(ApiTransport);
  wealth(month: string, periods: number) {
    return this.transport.get<WealthCard>('/dashboard/wealth', { month, periods });
  }
  allocation(month: string) {
    return this.transport.get<AllocationCard>('/dashboard/allocation', { month });
  }
  metric(kind: MetricKind, month: string) {
    return this.transport.get<MetricCard>(`/dashboard/${kind}`, { month });
  }
  currentSituation(month: string) {
    return this.transport.get<CurrentSituation>('/dashboard/current-situation', { month });
  }
}
