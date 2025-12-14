import React, { useMemo } from 'react';
import { useMobileStore } from '../store/mobileStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, User, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { transactions, users } = useMobileStore();

  const today = new Date().toISOString().split('T')[0];

  const reportData = useMemo(() => {
    // Filter for today's completed transactions
    const todaysTransactions = transactions.filter(t =>
      t.timestamp.startsWith(today) && t.status === 'completed'
    );

    const totalSales = todaysTransactions.reduce((sum, t) => sum + t.total, 0);

    const byMethod = {
      cash: todaysTransactions.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + t.total, 0),
      mpesa: todaysTransactions.filter(t => t.paymentMethod === 'mpesa').reduce((sum, t) => sum + t.total, 0),
      credit: todaysTransactions.filter(t => t.paymentMethod === 'credit').reduce((sum, t) => sum + t.total, 0),
    };

    const byUser = users.map(user => {
      const userSales = todaysTransactions.filter(t => t.cashierName === user.name || t.cashierId === user.id);
      return {
        name: user.name,
        role: user.role,
        total: userSales.reduce((sum, t) => sum + t.total, 0),
        count: userSales.length
      };
    }).filter(u => u.total > 0 || u.role === 'admin'); // Show all admins or anyone with sales

    return { totalSales, byMethod, byUser, count: todaysTransactions.length };
  }, [transactions, users, today]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="h-16 px-4 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Daily Report</h1>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 px-3 py-1 rounded-full">
          <Calendar className="w-3 h-3" /> {today}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/20 rounded-2xl p-4">
            <div className="text-xs text-emerald-400 font-medium uppercase mb-1">Total Sales</div>
            <div className="text-2xl font-bold text-white">KES {reportData.totalSales.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1">{reportData.count} Transactions</div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-2">
             <div className="flex justify-between text-xs">
               <span className="text-emerald-400">Cash</span>
               <span>{reportData.byMethod.cash.toLocaleString()}</span>
             </div>
             <div className="flex justify-between text-xs">
               <span className="text-green-400">M-Pesa</span>
               <span>{reportData.byMethod.mpesa.toLocaleString()}</span>
             </div>
             <div className="flex justify-between text-xs">
               <span className="text-orange-400">Credit</span>
               <span>{reportData.byMethod.credit.toLocaleString()}</span>
             </div>
          </div>
        </div>

        {/* Sales by User */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Cashier Performance</h2>
          <div className="space-y-3">
            {reportData.byUser.map(user => (
              <div key={user.name} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-white">{user.name}</div>
                    <div className="text-xs text-slate-500 capitalize">{user.role} • {user.count} Sales</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sky-400">KES {user.total.toLocaleString()}</div>
                </div>
              </div>
            ))}
            {reportData.byUser.length === 0 && (
              <div className="text-center text-slate-500 py-4 text-sm">No sales recorded today</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
