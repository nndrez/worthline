import { DecimalValue } from '../../shared/utils/money';
export type AccountType = 'CASH' | 'INVESTMENT' | 'PENSION';
export interface Account {
  id: string;
  name: string;
  type: AccountType;
}
export type AccountRequest = Omit<Account, 'id'>;
export interface MonthlyBalance {
  id: string;
  accountId: string;
  date: string;
  amount: DecimalValue;
  currency: 'EUR';
}
export interface BalanceRequest {
  accountId: string;
  date: string;
  amount: string;
}
