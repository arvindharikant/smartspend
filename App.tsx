import React, { useState, useEffect } from 'react';
import { View, Expense, AppSettings } from './types';
import { getExpenses, saveExpenses, getSettings, saveSettings } from './services/storage';
import { addExpenseToList, deleteExpenseFromList, editExpenseInList, mergeExpenses } from './services/logic';
import { getTranslations } from './services/i18n';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { Settings } from './components/Settings';
import { ExpenseForm } from './components/ExpenseForm';
import { LayoutDashboard, List, Settings as SettingsIcon, Plus } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setAppSettings] = useState<AppSettings>(getSettings());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const t = getTranslations(settings.language);

  // Load data on mount
  useEffect(() => {
    setExpenses(getExpenses());
  }, []);

  // Save data on change
  useEffect(() => {
    saveExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleSaveExpense = (expenseData: Omit<Expense, 'id'> & { id?: string }) => {
    if (expenseData.id) {
      // Edit
      const updated = { ...expenseData, id: expenseData.id! } as Expense;
      setExpenses(prev => editExpenseInList(prev, updated));
    } else {
      // Add
      const newExpense: Expense = {
        ...expenseData,
        id: crypto.randomUUID()
      };
      setExpenses(prev => addExpenseToList(prev, newExpense));
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm(t.confirmDelete)) {
      setExpenses(prev => deleteExpenseFromList(prev, id));
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleImportExpenses = (importedExpenses: Expense[]) => {
    // Logic already merged in Settings, this updates state
    setExpenses(importedExpenses);
  };

  const handleClearData = () => {
    setExpenses([]);
    localStorage.clear(); // Careful, this clears everything for the domain
    saveExpenses([]);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile Header - Glass */}
      <div className="md:hidden bg-white/60 backdrop-blur-lg border-b border-white/40 p-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600/90 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">S</div>
            <span className="font-bold text-gray-800 text-lg tracking-tight">{t.appTitle}</span>
        </div>
        <button 
          onClick={() => { setEditingExpense(null); setIsFormOpen(true); }}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg shadow-blue-500/40 hover:bg-blue-700 transition-colors"
          aria-label={t.addExpense}
        >
            <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar Navigation (Desktop) - Glass */}
      <aside className="hidden md:flex flex-col w-64 bg-white/40 backdrop-blur-xl border-r border-white/40 h-screen sticky top-0 z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">S</div>
          <span className="font-bold text-gray-900 text-xl tracking-tight">{t.appTitle}</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium duration-200 ${view === 'dashboard' ? 'bg-white/60 shadow-md text-blue-700 border border-white/50' : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> {t.dashboard}
          </button>
          <button 
            onClick={() => setView('expenses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium duration-200 ${view === 'expenses' ? 'bg-white/60 shadow-md text-blue-700 border border-white/50' : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'}`}
          >
            <List className="w-5 h-5" /> {t.expenses}
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium duration-200 ${view === 'settings' ? 'bg-white/60 shadow-md text-blue-700 border border-white/50' : 'text-gray-600 hover:bg-white/40 hover:text-gray-900'}`}
          >
            <SettingsIcon className="w-5 h-5" /> {t.settings}
          </button>
        </nav>

        <div className="p-6">
          <button 
            onClick={() => { setEditingExpense(null); setIsFormOpen(true); }}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] border border-white/10"
          >
            <Plus className="w-5 h-5" /> {t.addExpense}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8">
        {view === 'dashboard' && <Dashboard expenses={expenses} settings={settings} />}
        {view === 'expenses' && (
          <ExpenseList 
            expenses={expenses} 
            categories={settings.categories} 
            onDelete={handleDeleteExpense} 
            onEdit={handleEditExpense} 
            settings={settings}
          />
        )}
        {view === 'settings' && (
          <Settings 
            settings={settings} 
            onUpdateSettings={setAppSettings} 
            expenses={expenses} 
            onImportExpenses={handleImportExpenses}
            onClearData={handleClearData}
          />
        )}
      </main>

      {/* Mobile Bottom Nav - Glass */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-t border-white/40 flex justify-around p-3 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${view === 'dashboard' ? 'text-blue-600' : 'text-gray-500'}`}>
            <LayoutDashboard className="w-6 h-6" /> {t.dashboard}
          </button>
          <button onClick={() => setView('expenses')} className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${view === 'expenses' ? 'text-blue-600' : 'text-gray-500'}`}>
            <List className="w-6 h-6" /> {t.expenses}
          </button>
          <button onClick={() => setView('settings')} className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${view === 'settings' ? 'text-blue-600' : 'text-gray-500'}`}>
            <SettingsIcon className="w-6 h-6" /> {t.settings}
          </button>
      </div>

      <ExpenseForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSaveExpense} 
        initialData={editingExpense}
        categories={settings.categories}
        language={settings.language}
        currency={settings.currency}
      />
    </div>
  );
};

export default App;