import { BudgetEntry } from './types';

export const calcTotals = (entries: BudgetEntry[]) => {
  const income = entries
    .filter((entry) => entry.type === 'income')
    .reduce((sum, entry) => sum + entry.amount, 0);

  const expenses = entries
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + entry.amount, 0);

  return {
    income,
    expenses,
    balance: income - expenses,
  };
};

export const calcExpensesByCategory = (entries: BudgetEntry[]) => {
  const bucket = new Map<string, number>();

  entries
    .filter((entry) => entry.type === 'expense')
    .forEach((entry) => {
      const current = bucket.get(entry.category) ?? 0;
      bucket.set(entry.category, current + entry.amount);
    });

  return [...bucket.entries()].sort((a, b) => b[1] - a[1]);
};
