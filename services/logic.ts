import { Expense } from '../types';

/**
 * Pure function to add an expense to the list.
 * Prepends the new expense.
 */
export const addExpenseToList = (currentExpenses: Expense[], newExpense: Expense): Expense[] => {
  return [newExpense, ...currentExpenses];
};

/**
 * Pure function to delete an expense by ID.
 */
export const deleteExpenseFromList = (currentExpenses: Expense[], id: string): Expense[] => {
  return currentExpenses.filter(e => e.id !== id);
};

/**
 * Pure function to edit an existing expense.
 */
export const editExpenseInList = (currentExpenses: Expense[], updatedExpense: Expense): Expense[] => {
  return currentExpenses.map(e => e.id === updatedExpense.id ? updatedExpense : e);
};

/**
 * Pure function to calculate daily spending metrics.
 */
export const calculateDailyStats = (expenses: Expense[], dateStr: string, dailyLimit: number) => {
  const todaySpend = expenses
    .filter(e => e.date === dateStr)
    .reduce((sum, e) => sum + e.amount, 0);

  const limitPercentage = dailyLimit > 0 ? (todaySpend / dailyLimit) * 100 : 0;
  
  return {
    todaySpend,
    isOverLimit: todaySpend > dailyLimit,
    isNearLimit: todaySpend <= dailyLimit && limitPercentage >= 80,
    limitPercentage: Math.min(limitPercentage, 100)
  };
};

/**
 * Merges incoming expenses into the current list.
 * Strategy: Incoming items OVERRIDE existing items with the same ID.
 */
export const mergeExpenses = (current: Expense[], incoming: Expense[]): { merged: Expense[], stats: { added: number, updated: number, skipped: number } } => {
  const map = new Map<string, Expense>();
  
  // Load current
  current.forEach(e => map.set(e.id, e));

  let added = 0;
  let updated = 0;

  incoming.forEach(inc => {
    if (map.has(inc.id)) {
      updated++;
    } else {
      added++;
    }
    // Override or add
    map.set(inc.id, inc);
  });

  return {
    merged: Array.from(map.values()),
    stats: { added, updated, skipped: 0 }
  };
};