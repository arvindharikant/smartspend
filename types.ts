export interface Expense {
  id: string;
  amount: number;
  date: string; // ISO Date string YYYY-MM-DD
  category: string;
  description: string;
  tags: string[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon: string; // Lucide icon name
}

export interface AppSettings {
  dailyLimit: number;
  currency: string;
  categories: ExpenseCategory[];
  passwordHash?: string; // SHA-256 hash of the password
  language: 'en' | 'hi';
}

export type View = 'dashboard' | 'expenses' | 'settings';

export interface FilterState {
  startDate: string;
  endDate: string;
  category: string;
  search: string;
}