import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { Expense, ExpenseCategory } from '../types';

interface ChartsProps {
  expenses: Expense[];
  categories: ExpenseCategory[];
  currency: string;
}

export const ExpenseCharts: React.FC<ChartsProps> = ({ expenses, categories, currency }) => {
  
  // 1. Last 30 Days Trend
  const dailyData = useMemo(() => {
    const days = 30;
    const result = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const total = expenses
        .filter(e => e.date === dateStr)
        .reduce((sum, e) => sum + e.amount, 0);
        
      result.push({ date: dateStr, amount: total });
    }
    return result;
  }, [expenses]);

  // 2. Category Breakdown
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => {
      map.set(e.category, (map.get(e.category) || 0) + e.amount);
    });
    
    return Array.from(map.entries()).map(([name, value]) => {
      const cat = categories.find(c => c.name === name);
      return { name, value, color: cat ? cat.color : '#9CA3AF' };
    });
  }, [expenses, categories]);

  // 3. Weekly Summary (Last 8 weeks)
  const weeklyData = useMemo(() => {
    const weeks: {[key: string]: number} = {};
    const today = new Date();
    
    for(let i=0; i<8; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - (i * 7));
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const key = monday.toISOString().split('T')[0];
        if(!weeks[key]) weeks[key] = 0;
    }

    expenses.forEach(e => {
       const d = new Date(e.date);
       const timeDiff = today.getTime() - d.getTime();
       if(timeDiff > 8 * 7 * 24 * 60 * 60 * 1000) return;

       const day = d.getDay();
       const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
       const monday = new Date(d.setDate(diff));
       const key = monday.toISOString().split('T')[0];
       
       if (weeks[key] !== undefined) {
           weeks[key] += e.amount;
       }
    });

    return Object.entries(weeks)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([week, amount]) => ({ week: week.substring(5), amount }));
  }, [expenses]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Line Chart */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h3 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">Last 30 Days Spending</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 11, fill: '#6B7280'}} 
                tickFormatter={(val) => val.slice(5)} 
                stroke="transparent"
                minTickGap={30}
              />
              <YAxis stroke="transparent" tick={{fontSize: 11, fill: '#6B7280'}} />
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.5)', 
                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' 
                }}
                itemStyle={{ color: '#1F2937', fontWeight: 600 }}
                labelStyle={{ color: '#6B7280', marginBottom: '0.25rem' }}
                formatter={(value: number) => `${currency}${value.toFixed(2)}`}
              />
              <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={3} dot={false} activeDot={{r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h3 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">Category Breakdown</h3>
        <div className="h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} style={{filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))'}} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.5)', 
                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' 
                }}
                formatter={(value: number) => `${currency}${value.toFixed(2)}`} 
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:col-span-2">
        <h3 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">Weekly Summary (Last 8 Weeks)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.2)" />
              <XAxis dataKey="week" stroke="transparent" tick={{fontSize: 11, fill: '#6B7280'}} />
              <YAxis stroke="transparent" tick={{fontSize: 11, fill: '#6B7280'}} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.3)'}} 
                contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                    backdropFilter: 'blur(8px)',
                    borderRadius: '12px', 
                    border: '1px solid rgba(255,255,255,0.5)', 
                    boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' 
                }}
                formatter={(value: number) => `${currency}${value.toFixed(2)}`}
              />
              <Bar dataKey="amount" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};