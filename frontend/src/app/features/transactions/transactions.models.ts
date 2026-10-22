import { DecimalValue } from '../../shared/utils/money';
export type TransactionType = 'INCOME' | 'EXPENSE';
export interface Transaction {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: DecimalValue;
  currency: 'EUR';
  categoryId: string;
  tag: string | null;
  notes: string | null;
}
export interface TransactionRequest {
  date: string;
  description: string;
  type: TransactionType;
  amount: string;
  categoryId: string;
  tag: string | null;
  notes: string | null;
}
export interface CategoryOption {
  id: string;
  name: string;
  type: TransactionType;
  parentId: string | null;
}
