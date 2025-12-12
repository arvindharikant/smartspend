import { AppSettings, ExpenseCategory } from './types';

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: '1', name: 'Food', color: '#EF4444', icon: 'Utensils' }, // Red
  { id: '2', name: 'Transport', color: '#F59E0B', icon: 'Car' }, // Amber
  { id: '3', name: 'Housing', color: '#3B82F6', icon: 'Home' }, // Blue
  { id: '4', name: 'Entertainment', color: '#8B5CF6', icon: 'Film' }, // Violet
  { id: '5', name: 'Utilities', color: '#10B981', icon: 'Zap' }, // Emerald
  { id: '6', name: 'Health', color: '#EC4899', icon: 'Heart' }, // Pink
  { id: '7', name: 'Shopping', color: '#DB2777', icon: 'ShoppingBag' },
  { id: '8', name: 'Other', color: '#6B7280', icon: 'Circle' }, // Gray
];

export const DEFAULT_SETTINGS: AppSettings = {
  dailyLimit: 1000,
  currency: '₹',
  categories: DEFAULT_CATEGORIES,
  language: 'en'
};

export const STORAGE_KEY = 'spendwise_data_v1';
export const SETTINGS_KEY = 'spendwise_settings_v1';