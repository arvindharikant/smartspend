import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, AppSettings } from '../types';
import { Search, Filter, Trash2, Edit2, Tag } from 'lucide-react';
import { getTranslations } from '../services/i18n';
import { CategoryIcon } from './CategoryIcon';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
  categories: ExpenseCategory[];
  settings: AppSettings;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDelete, onEdit, categories, settings }) => {
  const t = getTranslations(settings.language);
  const [filter, setFilter] = useState({
    search: '',
    category: '',
    startDate: '',
    endDate: ''
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesSearch = e.description.toLowerCase().includes(filter.search.toLowerCase()) || 
                            e.tags.some(t => t.toLowerCase().includes(filter.search.toLowerCase()));
      const matchesCategory = filter.category ? e.category === filter.category : true;
      const matchesStart = filter.startDate ? e.date >= filter.startDate : true;
      const matchesEnd = filter.endDate ? e.date <= filter.endDate : true;
      return matchesSearch && matchesCategory && matchesStart && matchesEnd;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filter]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight drop-shadow-sm">{t.expenses}</h1>
        
        {/* Search Bar - Glass Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder}
            value={filter.search}
            onChange={(e) => setFilter({...filter, search: e.target.value})}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/50 bg-white/40 backdrop-blur-sm focus:bg-white/70 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-400 text-gray-700 shadow-sm"
            aria-label="Search expenses"
          />
        </div>
      </div>

      {/* Filters - Glass Panel */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-1 md:grid-cols-4 gap-4" role="search">
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t.category}</label>
            <div className="relative">
                <select 
                  value={filter.category} 
                  onChange={e => setFilter({...filter, category: e.target.value})}
                  className="w-full p-2.5 rounded-xl border border-white/40 bg-white/50 hover:bg-white/70 focus:bg-white/90 transition-all outline-none appearance-none text-gray-700 shadow-sm"
                >
                    <option value="">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
            </div>
        </div>
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Start Date</label>
            <input 
              type="date" 
              value={filter.startDate} 
              onChange={e => setFilter({...filter, startDate: e.target.value})}
              className="w-full p-2.5 rounded-xl border border-white/40 bg-white/50 hover:bg-white/70 focus:bg-white/90 transition-all outline-none text-gray-700 shadow-sm"
            />
        </div>
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">End Date</label>
            <input 
              type="date" 
              value={filter.endDate} 
              onChange={e => setFilter({...filter, endDate: e.target.value})}
              className="w-full p-2.5 rounded-xl border border-white/40 bg-white/50 hover:bg-white/70 focus:bg-white/90 transition-all outline-none text-gray-700 shadow-sm"
            />
        </div>
        <div className="flex items-end">
             <button 
                onClick={() => setFilter({ search: '', category: '', startDate: '', endDate: '' })}
                className="w-full py-2.5 rounded-xl text-sm text-gray-600 bg-white/30 hover:bg-white/60 hover:text-blue-600 font-semibold transition-all border border-white/40 shadow-sm flex items-center justify-center gap-2"
             >
                 <Filter className="w-4 h-4" /> Reset Filters
             </button>
        </div>
      </div>

      {/* List - Glass Table Container */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium">{t.noExpenses}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/30 border-b border-white/40 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="p-5">{t.date}</th>
                  <th className="p-5">{t.description}</th>
                  <th className="p-5">{t.category}</th>
                  <th className="p-5 text-right">{t.amount}</th>
                  <th className="p-5 text-center">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/40">
                {filteredExpenses.map(expense => {
                  const category = categories.find(c => c.name === expense.category);
                  const catColor = category?.color || '#9CA3AF';
                  const catIcon = category?.icon || 'Circle';
                  
                  return (
                    <tr key={expense.id} className="hover:bg-white/40 transition-colors group">
                      <td className="p-5 text-sm text-gray-700 whitespace-nowrap font-medium">{expense.date}</td>
                      <td className="p-5">
                        <div className="font-semibold text-gray-800">{expense.description}</div>
                        {expense.tags.length > 0 && (
                          <div className="flex gap-2 mt-1.5 flex-wrap">
                            {expense.tags.map(tag => (
                              <span key={tag} className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md bg-white/50 text-blue-600 border border-blue-100/50 shadow-sm">
                                <Tag className="w-3 h-3 mr-1" />{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-5">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border border-white/20 transition-transform hover:scale-105" style={{ backgroundColor: `${catColor}15`, color: catColor }}>
                           <CategoryIcon iconName={catIcon} className="w-4 h-4 mr-2" />
                           {expense.category}
                        </span>
                      </td>
                      <td className="p-5 text-right font-bold text-gray-800">
                        {settings.currency}{expense.amount.toFixed(2)}
                      </td>
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-all focus-within:opacity-100">
                          <button 
                            onClick={() => onEdit(expense)} 
                            className="p-2 text-blue-600 hover:bg-blue-50/80 rounded-lg transition-colors shadow-sm bg-white/30 hover:shadow" 
                            aria-label={`${t.edit} ${expense.description}`}
                            title={t.edit}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onDelete(expense.id)} 
                            className="p-2 text-red-600 hover:bg-red-50/80 rounded-lg transition-colors shadow-sm bg-white/30 hover:shadow" 
                            aria-label={`${t.delete} ${expense.description}`}
                            title={t.delete}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};