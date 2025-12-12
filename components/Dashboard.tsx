import React, { useMemo } from 'react';
import { Expense, AppSettings } from '../types';
import { ExpenseCharts } from './Charts';
import { calculateDailyStats } from '../services/logic';
import { getTranslations } from '../services/i18n';
import { ArrowUpRight, ArrowDownRight, DollarSign, AlertTriangle, Activity } from 'lucide-react';

interface DashboardProps {
  expenses: Expense[];
  settings: AppSettings;
}

export const Dashboard: React.FC<DashboardProps> = ({ expenses, settings }) => {
  const t = getTranslations(settings.language);
  const todayStr = new Date().toISOString().split('T')[0];
  
  const metrics = useMemo(() => {
    const dailyStats = calculateDailyStats(expenses, todayStr, settings.dailyLimit);

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlySpend = expenses
      .filter(e => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);
      
    const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);

    return { 
      ...dailyStats,
      monthlySpend, 
      totalSpend 
    };
  }, [expenses, todayStr, settings.dailyLimit]);

  return (
    <div className="animate-fade-in" role="region" aria-label="Dashboard Overview">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight drop-shadow-sm">{t.dashboard}</h1>
      </div>

      {/* Warnings - Glass Alerts */}
      {metrics.isOverLimit && (
        <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-md border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 animate-pulse shadow-sm" role="alert">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">{t.warningLimit}</span>
        </div>
      )}
      {metrics.isNearLimit && (
        <div className="mb-6 p-4 bg-amber-50/80 backdrop-blur-md border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700 shadow-sm" role="alert">
          <Activity className="w-5 h-5" />
          <span className="font-medium">{t.nearLimit.replace('{percent}', metrics.limitPercentage.toFixed(0))}</span>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Today - Glass Card */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t.todaySpend}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1 drop-shadow-sm">{settings.currency}{metrics.todaySpend.toFixed(2)}</h3>
            </div>
            <div className={`p-3 rounded-xl shadow-inner ${metrics.isOverLimit ? 'bg-red-100/50 text-red-600' : 'bg-blue-100/50 text-blue-600'}`}>
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
              <span>Progress</span>
              <span>{metrics.limitPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200/50 rounded-full h-2.5 overflow-hidden backdrop-blur-sm">
              <div 
                className={`h-2.5 rounded-full transition-all duration-1000 ease-out shadow-sm ${metrics.isOverLimit ? 'bg-gradient-to-r from-red-400 to-red-600' : metrics.isNearLimit ? 'bg-gradient-to-r from-amber-400 to-amber-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'}`} 
                style={{ width: `${metrics.limitPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2 font-medium">{t.dailyLimit}: {settings.currency}{settings.dailyLimit}</p>
          </div>
        </div>

        {/* Month - Glass Card */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t.monthSpend}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1 drop-shadow-sm">{settings.currency}{metrics.monthlySpend.toFixed(2)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-green-100/50 text-green-600 shadow-inner">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500 font-medium bg-white/30 rounded-lg p-2 inline-block">
             Running Total
          </div>
        </div>

        {/* Total - Glass Card */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{t.totalSpend}</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1 drop-shadow-sm">{settings.currency}{metrics.totalSpend.toFixed(2)}</h3>
            </div>
            <div className="p-3 rounded-xl bg-purple-100/50 text-purple-600 shadow-inner">
              <ArrowDownRight className="w-6 h-6" />
            </div>
          </div>
           <div className="mt-4 text-sm text-gray-500 font-medium bg-white/30 rounded-lg p-2 inline-block">
             All Time
          </div>
        </div>
      </div>

      <ExpenseCharts expenses={expenses} categories={settings.categories} currency={settings.currency} />
    </div>
  );
};