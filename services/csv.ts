import { Expense } from '../types';

export const generateCSVString = (expenses: Expense[]): string => {
  const headers = ['id', 'date', 'amount', 'category', 'description', 'tags'];
  return [
    headers.join(','),
    ...expenses.map(e => {
      const tags = e.tags.join(';');
      // Escape description if it contains commas or quotes
      const desc = e.description.includes(',') || e.description.includes('"') 
        ? `"${e.description.replace(/"/g, '""')}"` 
        : e.description;
      return `${e.id},${e.date},${e.amount},${e.category},${desc},${tags}`;
    })
  ].join('\n');
};

/**
 * Exports expenses to a CSV Blob and triggers download.
 */
export const exportExpenses = (expenses: Expense[]): void => {
  const csvContent = generateCSVString(expenses);

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `expenses_export_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Parses CSV text with strict validation and error reporting.
 */
export const importExpenses = (csvText: string): { expenses: Expense[], errors: string[] } => {
  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return { expenses: [], errors: ['File is empty or missing headers'] };

  const headers = lines[0].trim().split(',');
  const requiredCols = ['id', 'date', 'amount', 'category', 'description', 'tags'];
  
  // Map header names to indices
  const idx: Record<string, number> = {};
  requiredCols.forEach(col => {
    idx[col] = headers.indexOf(col);
  });

  if (Object.values(idx).some(i => i === -1)) {
    return { expenses: [], errors: [`Missing required columns: ${requiredCols.join(', ')}`] };
  }

  const expenses: Expense[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV parsing considering quotes
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let char of line) {
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current);

    if (parts.length < headers.length) {
      errors.push(`Line ${i + 1}: Insufficient columns`);
      continue;
    }

    try {
      const id = parts[idx.id].trim();
      const date = parts[idx.date].trim();
      const amountStr = parts[idx.amount].trim();
      const category = parts[idx.category].trim();
      let description = parts[idx.description] ? parts[idx.description].trim() : '';
      const tagsStr = parts[idx.tags] ? parts[idx.tags].trim() : '';

      // Validation
      if (!id) throw new Error('Missing ID');
      if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) throw new Error('Invalid Date format (YYYY-MM-DD required)');
      const amount = parseFloat(amountStr);
      if (isNaN(amount)) throw new Error('Invalid Amount');

      // Unescape description
      if (description.startsWith('"') && description.endsWith('"')) {
          description = description.slice(1, -1).replace(/""/g, '"');
      }

      expenses.push({
        id,
        date,
        amount,
        category: category || 'Uncategorized',
        description,
        tags: tagsStr ? tagsStr.split(';').map(t => t.trim()).filter(Boolean) : []
      });

    } catch (e: any) {
      errors.push(`Line ${i + 1}: ${e.message}`);
    }
  }

  return { expenses, errors };
};

/**
 * Wrapper for parsing CSV specifically for tests or internal logic that needs filtering.
 */
export const parseCSV = (csvText: string, existingExpenses: Expense[] = []): { newExpenses: Expense[], count: number, errors: number } => {
  const { expenses, errors } = importExpenses(csvText);
  const existingIds = new Set(existingExpenses.map(e => e.id));
  const newExpenses = expenses.filter(e => !existingIds.has(e.id));
  
  return {
    newExpenses,
    count: newExpenses.length,
    errors: errors.length
  };
};