import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'overview' },
  {
    path: 'overview',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'accounts',
    loadComponent: () => import('./features/wealth/account-list').then((m) => m.AccountList),
  },
  {
    path: 'balances',
    loadComponent: () => import('./features/wealth/balance-list').then((m) => m.BalanceList),
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./features/transactions/transaction-list').then((m) => m.TransactionList),
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/categories/category-list').then((m) => m.CategoryList),
  },
  {
    path: 'portfolio',
    loadComponent: () =>
      import('./features/portfolio/instrument-list').then((m) => m.InstrumentList),
  },
  {
    path: 'investment-operations',
    loadComponent: () => import('./features/portfolio/operation-list').then((m) => m.OperationList),
  },
  { path: '**', loadComponent: () => import('./layout/not-found').then((m) => m.NotFound) },
];
