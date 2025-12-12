import { addExpenseToList, deleteExpenseFromList, calculateDailyStats, mergeExpenses } from '../services/logic';
import { generateCSVString, parseCSV } from '../services/csv';
import { Expense } from '../types';

// Declare Jest globals to satisfy TypeScript compiler if types are missing
declare const describe: any;
declare const it: any;
declare const expect: any;

describe('Expense Tracker Core Logic', () => {
  
  const sampleExpenses: Expense[] = [
    { id: '1', date: '2023-10-25', amount: 50, category: 'Food', description: 'Groceries', tags: ['home'] },
    { id: '2', date: '2023-10-25', amount: 30, category: 'Transport', description: 'Gas', tags: [] },
    { id: '3', date: '2023-10-24', amount: 100, category: 'Housing', description: 'Rent', tags: ['bill'] },
  ];

  describe('addExpenseToList', () => {
    it('should add a new expense to the beginning of the list', () => {
      const newExpense: Expense = { id: '4', date: '2023-10-26', amount: 20, category: 'Food', description: 'Lunch', tags: [] };
      const result = addExpenseToList(sampleExpenses, newExpense);
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual(newExpense);
      expect(result[1].id).toBe('1'); // Existing items shifted
    });

    it('should not mutate the original array', () => {
      const newExpense = { id: '4', date: '2023-10-26', amount: 20, category: 'Food', description: 'Lunch', tags: [] };
      const originalLength = sampleExpenses.length;
      
      addExpenseToList(sampleExpenses, newExpense);
      expect(sampleExpenses).toHaveLength(originalLength);
    });
  });

  describe('deleteExpenseFromList', () => {
    it('should remove an expense by id', () => {
      const result = deleteExpenseFromList(sampleExpenses, '2');
      expect(result).toHaveLength(2);
      expect(result.find(e => e.id === '2')).toBeUndefined();
    });

    it('should return same list if id not found', () => {
      const result = deleteExpenseFromList(sampleExpenses, '999');
      expect(result).toHaveLength(3);
    });
  });

  describe('checkDailyLimit (calculateDailyStats)', () => {
    it('should correctly calculate total spend for a date', () => {
      const stats = calculateDailyStats(sampleExpenses, '2023-10-25', 100);
      expect(stats.todaySpend).toBe(80); // 50 + 30
    });

    it('should flag isOverLimit when spend > limit', () => {
      const stats = calculateDailyStats(sampleExpenses, '2023-10-25', 70);
      expect(stats.todaySpend).toBe(80);
      expect(stats.isOverLimit).toBe(true);
    });

    it('should flag isNearLimit when spend is between 80-100% of limit', () => {
      // 80 spent, limit 90 => 88.8%
      const stats = calculateDailyStats(sampleExpenses, '2023-10-25', 90);
      expect(stats.isOverLimit).toBe(false);
      expect(stats.isNearLimit).toBe(true);
    });

    it('should handle zero limit gracefully', () => {
      const stats = calculateDailyStats(sampleExpenses, '2023-10-25', 0);
      expect(stats.isOverLimit).toBe(true);
      expect(stats.limitPercentage).toBe(100); // Capped at 100 usually, or handling div by zero logic
    });
  });

  describe('mergeExpenses', () => {
    it('should merge new expenses skipping duplicate IDs', () => {
      const existing = [sampleExpenses[0]]; // ID '1'
      const imported = [
        { id: '1', date: '2023-10-25', amount: 500, category: 'Changed', description: 'Modified', tags: [] }, // Duplicate ID
        { id: '2', date: '2023-10-25', amount: 30, category: 'Transport', description: 'Gas', tags: [] } // New
      ];
      
      const { merged, stats } = mergeExpenses(existing, imported);
      
      expect(merged).toHaveLength(2);
      expect(stats.added).toBe(1);
      // Should preserve existing '1' and add '2'
      expect(merged.find(e => e.id === '1')?.amount).toBe(50); 
      expect(merged.find(e => e.id === '2')).toBeDefined();
    });
  });

  describe('CSV Utilities', () => {
    describe('generateCSVString', () => {
      it('should generate valid CSV header and rows', () => {
        const result = generateCSVString([sampleExpenses[0]]);
        const lines = result.split('\n');
        expect(lines[0]).toContain('id,date,amount,category,description,tags');
        expect(lines[1]).toContain('1,2023-10-25,50,Food,Groceries,home');
      });

      it('should escape descriptions containing commas', () => {
        const complexExpense = { ...sampleExpenses[0], description: 'Apples, Oranges' };
        const result = generateCSVString([complexExpense]);
        expect(result).toContain('"Apples, Oranges"');
      });
    });

    describe('parseCSV', () => {
      it('should parse valid CSV string into expenses', () => {
        const csv = `id,date,amount,category,description,tags\n99,2023-01-01,10.50,Test,Desc,tag1;tag2`;
        const { newExpenses, count, errors } = parseCSV(csv, []);
        
        expect(count).toBe(1);
        expect(errors).toBe(0);
        expect(newExpenses[0]).toEqual({
          id: '99',
          date: '2023-01-01',
          amount: 10.50,
          category: 'Test',
          description: 'Desc',
          tags: ['tag1', 'tag2']
        });
      });

      it('should handle quoted CSV fields correctly', () => {
        const csv = `id,date,amount,category,description,tags\n100,2023-01-01,5,Food,"Pizza, Pasta",lunch`;
        const { newExpenses } = parseCSV(csv, []);
        
        expect(newExpenses[0].description).toBe('Pizza, Pasta');
      });

      it('should skip items with existing IDs provided in context', () => {
        const csv = `id,date,amount,category,description,tags\n1,2023-10-25,50,Food,Groceries,home`;
        // Pass sampleExpenses which already contains ID '1'
        const { count } = parseCSV(csv, sampleExpenses);
        expect(count).toBe(0);
      });

      it('should count errors for malformed lines', () => {
        const csv = `id,date,amount\nbad_line_data`;
        const { errors } = parseCSV(csv, []);
        expect(errors).toBeGreaterThan(0);
      });
    });
  });
});