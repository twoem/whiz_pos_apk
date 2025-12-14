import React, { useState } from 'react';
import { useMobileStore } from '../store/mobileStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, User, Phone, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function CreditCustomersPage() {
  const navigate = useNavigate();
  const { creditCustomers, addCreditCustomer, addToSyncQueue } = useMobileStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const filteredCustomers = creditCustomers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const handleAddCustomer = () => {
    if (!newName || !newPhone) return;

    const newCustomer = {
      id: crypto.randomUUID(),
      name: newName,
      phone: newPhone,
      balance: 0,
      notes: ''
    };

    addCreditCustomer(newCustomer);
    addToSyncQueue({ type: 'credit-customer', data: newCustomer }); // type 'credit-customer' maps to backend handler

    setNewName('');
    setNewPhone('');
    setIsAdding(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="h-16 px-4 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-20">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold">Credit Customers</h1>
        <div className="flex-1" />
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-sky-500 rounded-full hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/20"
        >
          <Plus className={cn("w-5 h-5 transition-transform", isAdding ? "rotate-45" : "")} />
        </button>
      </header>

      {/* Add Customer Form */}
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
                <label className="text-xs font-medium text-slate-400 ml-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400 ml-1">Phone Number</label>
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="07..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50"
                />
              </div>
              <button
                onClick={handleAddCustomer}
                disabled={!newName || !newPhone}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold py-3 rounded-xl transition-all"
              >
                Create Customer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search name or phone..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-sky-500/50 transition-all placeholder:text-slate-600"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No customers found</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">{customer.name}</h3>
                <div className="flex items-center gap-2 mt-1 text-slate-400 text-sm">
                  <Phone className="w-3 h-3" /> {customer.phone}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs text-slate-500 uppercase font-medium">Balance</span>
                <span className={cn(
                  "font-bold text-xl",
                  customer.balance > 0 ? "text-red-400" : "text-emerald-400"
                )}>
                   KES {customer.balance.toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
