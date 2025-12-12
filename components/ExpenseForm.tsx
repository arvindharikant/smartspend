import React, { useState, useEffect, useRef } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { X, Check } from 'lucide-react';
import { getTranslations, Language } from '../services/i18n';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'> & { id?: string }) => void;
  initialData?: Expense | null;
  categories: ExpenseCategory[];
  language: Language;
  currency: string;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ isOpen, onClose, onSave, initialData, categories, language, currency }) => {
  const t = getTranslations(language);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    tags: ''
  });

  useEffect(() => {
    if (isOpen) {
      // Load data
      if (initialData) {
        setFormData({
          amount: initialData.amount.toString(),
          date: initialData.date,
          category: initialData.category,
          description: initialData.description,
          tags: initialData.tags.join(', ')
        });
      } else {
        setFormData({
          amount: '',
          date: new Date().toISOString().split('T')[0],
          category: categories[0]?.name || 'Uncategorized',
          description: '',
          tags: ''
        });
      }
      
      // Focus Management: Focus first input after render
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialData, categories]);

  // Trap focus or handle Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData?.id,
      amount: parseFloat(formData.amount),
      date: formData.date,
      category: formData.category,
      description: formData.description,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 backdrop-blur-sm p-4 transition-all"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex justify-between items-center p-6 border-b border-white/40 bg-white/40 sticky top-0 z-10 backdrop-blur-xl">
          <h2 id="modal-title" className="text-xl font-bold text-gray-800 tracking-tight">
            {initialData ? t.editExpense : t.newExpense}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 hover:bg-white/50 transition-colors rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={t.cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label htmlFor="amount" className="block text-sm font-bold text-gray-700 mb-1.5">{t.amount}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold select-none pointer-events-none text-lg">
                {currency}
              </span>
              <input
                id="amount"
                ref={firstInputRef}
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-white/50 bg-white/50 rounded-xl focus:bg-white/80 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all text-lg font-semibold text-gray-800 shadow-sm"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-bold text-gray-700 mb-1.5">{t.date}</label>
            <input
              id="date"
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 border border-white/50 bg-white/50 rounded-xl focus:bg-white/80 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-medium text-gray-800 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">{t.category}</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {categories.map(c => {
                const isSelected = formData.category === c.name;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: c.name })}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all relative ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]' : 'bg-white/50 border-white/50 text-gray-600 hover:bg-white/80 hover:border-gray-300'}`}
                  >
                    <div className={`p-1.5 rounded-full mb-1.5 ${isSelected ? 'bg-white/20' : ''}`} style={!isSelected ? { backgroundColor: `${c.color}20`, color: c.color } : {}}>
                      <CategoryIcon iconName={c.icon} className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold leading-tight text-center truncate w-full">{c.name}</span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-white text-blue-600 rounded-full p-0.5 shadow-sm">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-bold text-gray-700 mb-1.5">{t.description}</label>
            <input
              id="description"
              type="text"
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-white/50 bg-white/50 rounded-xl focus:bg-white/80 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-medium text-gray-800 shadow-sm"
              placeholder="e.g. Groceries"
            />
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-bold text-gray-700 mb-1.5">{t.tags}</label>
            <input
              id="tags"
              type="text"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-3 border border-white/50 bg-white/50 rounded-xl focus:bg-white/80 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all font-medium text-gray-800 shadow-sm"
              placeholder="e.g. work, coffee"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-white/60 bg-white/40 text-gray-700 rounded-xl hover:bg-white/60 transition-colors font-bold focus:ring-2 focus:ring-gray-300"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-bold shadow-lg shadow-blue-500/30 focus:ring-2 focus:ring-blue-500 transform active:scale-95"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};