import React, { useState } from 'react';
import { useMobileStore } from '../store/mobileStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function ExpensesPage() {
  const navigate = useNavigate();
  const { expenses, addExpense, addToSyncQueue, currentUser } = useMobileStore();

  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Operating Cost');

  const categories = ['Operating Cost', 'Salary', 'Inventory', 'Maintenance', 'Utility', 'Other'];

  const handleAddExpense = () => {
    if (!description || !amount) return;

    const isoDate = new Date().toISOString();
    const newExpense = {
      id: `EXP${Date.now().toString().slice(-6)}`,
      description,
      amount: parseFloat(amount),
      category,
      date: isoDate,
      timestamp: isoDate, // Desktop expects 'timestamp'
      cashierId: currentUser?.id,
      cashierName: currentUser?.name,
      cashier: currentUser?.name // Desktop/BackOffice expects 'cashier'
    };

    // Add to local store
    addExpense(newExpense);

    // Add to sync queue
    // Type must be 'add-expense' to be processed correctly by Desktop and Back Office
    addToSyncQueue({ type: 'add-expense', data: newExpense });

    // Reset form
    setDescription('');
    setAmount('');
    setIsAdding(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="h-16 px-4 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Expenses</h1>
        <div className="flex-1" />
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-sky-500 rounded-full hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/20"
        >
          <Plus className={cn("w-5 h-5 transition-transform", isAdding ? "rotate-45" : "")} />
        </button>
      </header>

      {/* Add Expense Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white/5 border-b border-white/5"
          >
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 ml-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Lunch, Transport"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 ml-1">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 ml-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50 appearance-none text-white"
                  >
                    {categories.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddExpense}
                disabled={!description || !amount}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 rounded-xl transition-all"
              >
                Save Expense
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No expenses recorded</p>
          </div>
        ) : (
          expenses.map(expense => (
            <div key={expense.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">{expense.description}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{expense.category}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(expense.date).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="font-bold text-lg text-red-400">
                - KES {expense.amount.toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
