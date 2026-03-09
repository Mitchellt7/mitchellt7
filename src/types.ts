export type EntryType = 'income' | 'expense';

export type BudgetEntry = {
  id: string;
  title: string;
  amount: number;
  category: string;
  type: EntryType;
  date: string;
};

export type SavingsGoal = {
  targetAmount: number;
};
