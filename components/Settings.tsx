import React, { useRef, useState, useEffect } from 'react';
import { AppSettings, ExpenseCategory, Expense } from '../types';
import { exportExpenses, importExpenses } from '../services/csv';
import { hashPassword } from '../services/crypto';
import { mergeExpenses } from '../services/logic';
import { getTranslations } from '../services/i18n';
import { CategoryIcon, ICON_OPTIONS } from './CategoryIcon';
import { Download, Upload, Trash2, Plus, Save, AlertCircle, Lock, KeyRound, Unlock, Globe, Coins, Check } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  expenses: Expense[];
  onImportExpenses: (e: Expense[]) => void;
  onClearData: () => void;
}

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥)' },
];

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, expenses, onImportExpenses, onClearData }) => {
  const t = getTranslations(settings.language);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Lock State
  const [isLocked, setIsLocked] = useState(!!settings.passwordHash);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Settings State
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#000000');
  const [newCatIcon, setNewCatIcon] = useState('Circle');
  const [limit, setLimit] = useState(settings.dailyLimit.toString());
  
  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!settings.passwordHash) {
        setIsLocked(false);
    }
  }, [settings.passwordHash]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.passwordHash) return;

    const hash = await hashPassword(unlockPassword);
    if (hash === settings.passwordHash) {
      setIsLocked(false);
      setUnlockError('');
      setUnlockPassword('');
    } else {
      setUnlockError('Incorrect password');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (settings.passwordHash) {
        const oldHash = await hashPassword(oldPassword);
        if (oldHash !== settings.passwordHash) {
            alert("Current password is incorrect.");
            return;
        }
    }

    if (!newPassword) {
        if (confirm("Leaving the new password empty will remove password protection. Are you sure?")) {
            const updated = { ...settings };
            delete updated.passwordHash;
            onUpdateSettings(updated);
            setIsChangingPassword(false);
            setOldPassword('');
        }
        return;
    }

    const newHash = await hashPassword(newPassword);
    onUpdateSettings({ ...settings, passwordHash: newHash });
    setIsChangingPassword(false);
    setOldPassword('');
    setNewPassword('');
    alert("Password updated successfully.");
  };

  const handleSaveLimit = () => {
    onUpdateSettings({ ...settings, dailyLimit: parseFloat(limit) });
  };

  const handleAddCategory = () => {
    if (!newCatName) return;
    const newCat: ExpenseCategory = {
      id: crypto.randomUUID(),
      name: newCatName,
      color: newCatColor,
      icon: newCatIcon
    };
    onUpdateSettings({ ...settings, categories: [...settings.categories, newCat] });
    setNewCatName('');
    setNewCatIcon('Circle');
  };

  const handleDeleteCategory = (id: string) => {
    onUpdateSettings({ ...settings, categories: settings.categories.filter(c => c.id !== id) });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      try {
        const { expenses: imported, errors } = importExpenses(text);
        
        if (errors.length > 0) {
            if (!confirm(`Found ${errors.length} errors/warnings (e.g., "${errors[0]}"). Continue importing valid rows?`)) {
                return;
            }
        }
        
        const { merged, stats } = mergeExpenses(expenses, imported);
        onImportExpenses(merged);
        
        const msg = t.importSuccess
            .replace('{added}', stats.added.toString())
            .replace('{updated}', stats.updated.toString())
            .replace('{skipped}', errors.length.toString());
        alert(msg);

      } catch (err: any) {
        alert(err.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in" role="main" aria-label="Locked Settings">
        <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-3xl shadow-xl border border-white/50 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Settings Locked</h2>
            <p className="text-gray-600 mb-6 text-sm font-medium">Please enter your password to access settings.</p>
            
            <form onSubmit={handleUnlock} className="space-y-4">
                <input 
                    type="password" 
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    placeholder={t.password}
                    className="w-full px-4 py-3 border border-white/60 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-medium placeholder:text-gray-400"
                    autoFocus
                />
                {unlockError && <p className="text-red-500 text-sm font-medium" role="alert">{unlockError}</p>}
                <button 
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                >
                    <Unlock className="w-4 h-4" /> Unlock
                </button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight drop-shadow-sm">{t.settings}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Language */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-gray-600" /> {t.language}
          </h2>
          <div className="flex gap-4">
              <button 
                  onClick={() => onUpdateSettings({ ...settings, language: 'en' })}
                  className={`px-5 py-2.5 rounded-xl border font-medium transition-all ${settings.language === 'en' ? 'bg-blue-50/80 border-blue-500 text-blue-700 shadow-sm' : 'border-white/60 bg-white/30 text-gray-700 hover:bg-white/60'}`}
              >
                  English
              </button>
              <button 
                  onClick={() => onUpdateSettings({ ...settings, language: 'hi' })}
                  className={`px-5 py-2.5 rounded-xl border font-medium transition-all ${settings.language === 'hi' ? 'bg-blue-50/80 border-blue-500 text-blue-700 shadow-sm' : 'border-white/60 bg-white/30 text-gray-700 hover:bg-white/60'}`}
              >
                  हिंदी
              </button>
          </div>
        </div>

        {/* Currency */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-gray-600" /> {t.currency}
          </h2>
          <div className="flex flex-wrap gap-2">
              {CURRENCIES.map(curr => (
                <button 
                    key={curr.code}
                    onClick={() => onUpdateSettings({ ...settings, currency: curr.symbol })}
                    className={`px-4 py-2 rounded-xl border font-medium transition-all text-sm ${settings.currency === curr.symbol ? 'bg-blue-50/80 border-blue-500 text-blue-700 shadow-sm' : 'border-white/60 bg-white/30 text-gray-700 hover:bg-white/60'}`}
                >
                    {curr.label}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-gray-600" /> {t.security}
        </h2>
        
        {!isChangingPassword ? (
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-gray-700">{t.password}</p>
                    <p className="text-sm text-gray-500 font-medium">
                        {settings.passwordHash ? 'Settings are currently password protected.' : 'No password set.'}
                    </p>
                </div>
                <button 
                    onClick={() => setIsChangingPassword(true)}
                    className="px-5 py-2.5 border border-white/60 bg-white/40 rounded-xl hover:bg-white/70 text-gray-700 font-bold text-sm shadow-sm transition-all"
                >
                    {settings.passwordHash ? 'Change Password' : 'Set Password'}
                </button>
            </div>
        ) : (
            <form onSubmit={handleChangePassword} className="bg-white/30 p-5 rounded-xl space-y-4 animate-fade-in border border-white/40">
                {settings.passwordHash && (
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Current Password</label>
                        <input 
                            type="password"
                            value={oldPassword}
                            onChange={e => setOldPassword(e.target.value)}
                            className="w-full px-4 py-2.5 border border-white/50 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                        />
                    </div>
                )}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">
                        {settings.passwordHash ? 'New Password' : 'Create Password'}
                    </label>
                    <input 
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Leave empty to remove protection"
                        className="w-full px-4 py-2.5 border border-white/50 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                    />
                </div>
                <div className="flex gap-3 pt-2">
                    <button 
                        type="button" 
                        onClick={() => { setIsChangingPassword(false); setOldPassword(''); setNewPassword(''); }}
                        className="px-5 py-2 text-gray-600 hover:text-gray-800 text-sm font-bold hover:bg-white/40 rounded-lg transition-colors"
                    >
                        {t.cancel}
                    </button>
                    <button 
                        type="submit" 
                        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md shadow-blue-200"
                    >
                        {t.save}
                    </button>
                </div>
            </form>
        )}
      </div>

      {/* Daily Limit */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            {t.dailyLimit}
        </h2>
        <div className="flex gap-4 items-end max-w-sm">
            <div className="w-full">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Limit ({settings.currency})</label>
                <input 
                    type="number" 
                    value={limit} 
                    onChange={e => setLimit(e.target.value)}
                    className="w-full px-4 py-2.5 border border-white/50 bg-white/50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-gray-800 shadow-sm"
                />
            </div>
            <button 
                onClick={handleSaveLimit}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30"
            >
                <Save className="w-4 h-4" /> {t.save}
            </button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="text-lg font-bold text-gray-800 mb-4">{t.categories}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
                {settings.categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3.5 bg-white/50 border border-white/40 rounded-xl group hover:shadow-sm transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl shadow-sm ring-1 ring-white flex items-center justify-center text-white" style={{ backgroundColor: cat.color }}>
                              <CategoryIcon iconName={cat.icon} className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-gray-700">{cat.name}</span>
                        </div>
                        <button 
                            onClick={() => handleDeleteCategory(cat.id)} 
                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
                            aria-label={`${t.delete} ${cat.name}`}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
            <div className="p-5 border-2 border-dashed border-gray-300/50 rounded-2xl bg-white/20">
                <h3 className="text-sm font-bold text-gray-700 mb-4">Add New Category</h3>
                <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Icon</label>
                      <div className="grid grid-cols-6 gap-2">
                        {ICON_OPTIONS.map(opt => (
                          <button
                            key={opt.name}
                            onClick={() => setNewCatIcon(opt.name)}
                            className={`p-2 rounded-lg flex items-center justify-center transition-all ${newCatIcon === opt.name ? 'bg-gray-800 text-white shadow-md scale-110' : 'bg-white/40 hover:bg-white/70 text-gray-600'}`}
                            title={opt.name}
                          >
                            <opt.component className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Name</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Gym"
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                            className="w-full px-3 py-2.5 border border-white/50 bg-white/50 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Color</label>
                        <div className="flex items-center gap-2">
                          <input 
                              type="color" 
                              value={newCatColor}
                              onChange={e => setNewCatColor(e.target.value)}
                              className="h-10 w-full p-0 border-0 rounded-lg cursor-pointer shadow-sm ring-2 ring-white/50"
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                        onClick={handleAddCategory}
                        disabled={!newCatName}
                        className="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-colors text-sm font-bold disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-gray-400/20"
                    >
                        <Plus className="w-4 h-4" /> Add Category
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Data Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
                onClick={() => exportExpenses(expenses)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50/80 text-green-700 border border-green-200/60 rounded-xl hover:bg-green-100/80 transition-all font-bold shadow-sm"
            >
                <Download className="w-5 h-5" /> {t.exportCSV}
            </button>
            <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 bg-blue-50/80 text-blue-700 border border-blue-200/60 rounded-xl hover:bg-blue-100/80 transition-all font-bold shadow-sm">
                <Upload className="w-5 h-5" /> {t.importCSV}
                <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                />
            </label>
            <button 
                onClick={() => {
                    if(confirm(t.confirmClear)) {
                        onClearData();
                    }
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50/80 text-red-700 border border-red-200/60 rounded-xl hover:bg-red-100/80 transition-all font-bold shadow-sm"
            >
                <Trash2 className="w-5 h-5" /> {t.clearData}
            </button>
        </div>
        <div className="mt-4 flex items-start gap-2 text-sm text-gray-500 bg-white/40 p-4 rounded-xl border border-white/40" role="note">
             <AlertCircle className="w-4 h-4 mt-0.5 text-gray-400" />
             <p className="font-medium">Data is stored locally in your browser. Clearing browser cache will remove this data. Use Export CSV to backup your data regularly.</p>
        </div>
      </div>
    </div>
  );
};