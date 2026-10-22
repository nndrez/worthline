export type CategoryType = 'INCOME' | 'EXPENSE';
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  parentId: string | null;
}
export type CategoryRequest = Omit<Category, 'id'>;
