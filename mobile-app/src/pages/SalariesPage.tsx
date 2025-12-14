import React, { useState } from 'react';
import { useMobileStore } from '../store/mobileStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, DollarSign, Calendar, Trash2, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function SalariesPage() {
  const navigate = useNavigate();
  const { salaries, addSalary, currentUser, addToSyncQueue } = useMobileStore();
  const [isAdding, setIsAdding] = useState(false);

  // Access Control: Redirect if not admin
  React.useEffect(() => {
    if (currentUser?.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  if (currentUser?.role !== 'admin') return null;

  // Form State
  const [employeeName, setEmployeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'full' | 'advance'>('full');
  const [notes, setNotes] = useState('');

  const [searchQuery, setSearchQuery] = useState('');

  const filteredSalaries = (salaries || []).filter(s =>
    s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !amount) return;

    const newSalary = {
      id: `SAL${Date.now()}`,
      employeeName,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      type,
      notes,
      recordedBy: currentUser?.name
    };

    addSalary(newSalary);
    addToSyncQueue({ type: 'add-salary', data: newSalary });

    // Reset
    setEmployeeName('');
    setAmount('');
    setType('full');
    setNotes('');
    setIsAdding(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="h-16 px-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold">Salaries</h1>
        </div>
        <button
            onClick={() => setIsAdding(true)}
            className="p-2 bg-emerald-500/20 text-emerald-400 rounded-full hover:bg-emerald-500/30 transition-colors"
        >
            <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search salaries..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/50 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {filteredSalaries.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No salary records found</p>
          </div>
        ) : (
          filteredSalaries.map(salary => (
            <div key={salary.id} className="bg-white/5 border border-white/5 rounded-2xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg">{salary.employeeName}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(salary.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-emerald-400">KES {salary.amount.toLocaleString()}</div>
                  <span className={cn(
                    "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full",
                    salary.type === 'full' ? "bg-sky-500/20 text-sky-400" : "bg-orange-500/20 text-orange-400"
                  )}>
                    {salary.type}
                  </span>
                </div>
              </div>
              {salary.notes && (
                <p className="text-sm text-slate-400 mt-2 bg-black/20 p-2 rounded-lg">
                  {salary.notes}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Record Salary</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-white/5 rounded-full text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Employee Name</label>
                  <input
                    type="text"
                    required
                    value={employeeName}
                    onChange={e => setEmployeeName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Amount</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Payment Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType('full')}
                      className={cn(
                        "py-3 rounded-xl border transition-all",
                        type === 'full'
                          ? "bg-sky-500/20 border-sky-500 text-sky-400 font-bold"
                          : "bg-white/5 border-white/5 text-slate-400"
                      )}
                    >
                      Full Salary
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('advance')}
                      className={cn(
                        "py-3 rounded-xl border transition-all",
                        type === 'advance'
                          ? "bg-orange-500/20 border-orange-500 text-orange-400 font-bold"
                          : "bg-white/5 border-white/5 text-slate-400"
                      )}
                    >
                      Advance
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50 h-24 resize-none"
                    placeholder="Additional details..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-4"
                >
                  Save Record
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
