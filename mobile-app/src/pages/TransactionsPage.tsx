import React, { useState } from 'react';
import { useMobileStore } from '../store/mobileStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Receipt, Calendar, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../services/api';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { transactions } = useMobileStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = transactions.filter(t =>
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.total.toString().includes(searchQuery)
  );

  const handleReprint = async (transaction: any) => {
    try {
      await api.printReceipt(transaction);
      alert('Reprint sent to printer');
    } catch (e) {
      alert('Failed to print receipt. Check connection.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="h-16 px-4 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Transactions</h1>
      </header>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID or Amount..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map(transaction => (
            <div key={transaction.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-slate-500">#{transaction.id.slice(0, 8)}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                    transaction.paymentMethod === 'cash' ? "bg-emerald-500/20 text-emerald-400" :
                    transaction.paymentMethod === 'mpesa' ? "bg-green-500/20 text-green-400" :
                    "bg-orange-500/20 text-orange-400"
                  )}>
                    {transaction.paymentMethod}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Calendar className="w-3 h-3" />
                  {new Date(transaction.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span className="font-bold text-lg">KES {transaction.total.toLocaleString()}</span>
                <button
                  onClick={() => handleReprint(transaction)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors"
                >
                  Reprint
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
