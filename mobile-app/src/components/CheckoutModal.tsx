import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Loader2, User, Search, Plus, Phone, Download, Share2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { useMobileStore } from '../store/mobileStore';
import { api } from '../services/api';
import { generateReceiptImage } from '../utils/receiptGenerator';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
}

export default function CheckoutModal({ isOpen, onClose, total }: CheckoutModalProps) {
  const { cart, clearCart, addToSyncQueue, currentUser, creditCustomers, addCreditCustomer, updateCreditCustomer, businessSetup } = useMobileStore();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'credit' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null); // To store tx for receipt generation
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Credit Customer Logic
  const [isCreditSelectionOpen, setIsCreditSelectionOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const customerNames = useMemo(() => [...new Set(creditCustomers.map(c => c.name))], [creditCustomers]);

  const filteredCustomers = useMemo(() => {
    return creditCustomers.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    );
  }, [creditCustomers, searchQuery]);

  const handlePaymentSelect = (method: 'cash' | 'mpesa' | 'credit') => {
    if (method === 'credit') {
      setIsCreditSelectionOpen(true);
    } else {
      setPaymentMethod(method);
      setSelectedCustomer(null);
    }
  };

  const handleAddCustomer = () => {
    if (!newCustomerName || !newCustomerPhone) return;
    const newCustomer = {
        id: crypto.randomUUID(),
        name: newCustomerName,
        phone: newCustomerPhone,
        balance: 0,
        createdAt: new Date().toISOString()
    };
    addCreditCustomer(newCustomer);
    addToSyncQueue({ type: 'add-credit-customer', data: newCustomer });

    // Auto-select
    setSelectedCustomer(newCustomer);
    setPaymentMethod('credit');
    setIsCreditSelectionOpen(false);
    setIsAddingCustomer(false);
  };

  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setPaymentMethod('credit');
    setIsCreditSelectionOpen(false);
  };

  const handleCheckout = async () => {
    if (!paymentMethod) return;

    setIsProcessing(true);

    // Map items to match Desktop format { product: ..., quantity: ... }
    // Optimize payload by stripping unnecessary product details (images, etc)
    const formattedItems = cart.map(item => ({
        product: {
            id: item.id,
            name: item.name,
            price: item.price,
            category: item.category
        },
        quantity: item.quantity
    }));

    // Standard TXN format
    const transactionId = `TXN${Date.now()}`;

    const transaction = {
      id: transactionId,
      items: formattedItems,
      total,
      paymentMethod,
      timestamp: new Date().toISOString(),
      cashierId: currentUser?.id,
      cashierName: currentUser?.name,
      cashier: currentUser?.name || 'Mobile User',
      creditCustomerId: selectedCustomer?.id,
      creditCustomer: selectedCustomer?.name,
      creditCustomerName: selectedCustomer?.name,
      status: 'completed'
    };

    setCurrentTransaction(transaction); // Store for receipt generation

    // 1. Add Transaction to sync queue
    addToSyncQueue({ type: 'transaction', data: transaction });

    // 2. Update Credit Balance if applicable
    if (paymentMethod === 'credit' && selectedCustomer) {
        const newBalance = (selectedCustomer.balance || 0) + total;

        // Update local store immediately for UI reflection
        updateCreditCustomer(selectedCustomer.id, { balance: newBalance });

        // Queue sync operation for the balance update
        addToSyncQueue({
            type: 'update-credit-customer',
            data: { id: selectedCustomer.id, updates: { balance: newBalance } }
        });
    }

    // 3. Try to print receipt remotely (queue it on desktop)
    try {
      await api.printReceipt(transaction);
    } catch (e) {
      console.warn('Print failed or offline', e);
    }

    // 4. Clear cart and show success
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
      // Keep success message open for manual close or timeout
      setTimeout(() => {
        // Automatically close after a delay if user doesn't interact
        if (document.body.contains(document.getElementById('success-view'))) {
             onClose();
             resetState();
        }
      }, 5000);
    }, 1000);
  };

  const resetState = () => {
      setIsSuccess(false);
      setPaymentMethod(null);
      setSelectedCustomer(null);
      setIsCreditSelectionOpen(false);
      setCurrentTransaction(null);
  }

  const generateImage = async () => {
    if (!currentTransaction) return null;
    try {
       const dataUrl = await generateReceiptImage(currentTransaction, businessSetup);
       setGeneratedImage(dataUrl);
       return dataUrl;
    } catch (e) {
       console.error("Failed to generate receipt", e);
       alert("Failed to generate receipt image");
       return null;
    }
  };

  const handleShareReceipt = async () => {
      let dataUrl = generatedImage;
      if (!dataUrl) dataUrl = await generateImage();
      if (!dataUrl) return;

      try {
          const fileName = `receipt-${currentTransaction.id}.png`;
          const savedFile = await Filesystem.writeFile({
              path: fileName,
              data: dataUrl,
              directory: Directory.Cache
          });

          await Share.share({
              title: 'Receipt',
              text: `Receipt for transaction ${currentTransaction.id}`,
              url: savedFile.uri,
              dialogTitle: 'Share Receipt'
          });
      } catch (e) {
          console.error('Error sharing', e);
          // Fallback for web
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `Receipt-${currentTransaction.id}.png`;
          link.click();
      }
  };

  const handleSaveReceipt = async () => {
      let dataUrl = generatedImage;
      if (!dataUrl) dataUrl = await generateImage();
      if (!dataUrl) return;

      try {
          const fileName = `Receipt-${currentTransaction.id}.png`;
          // For web/browser download
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Note: For native saving to gallery, we'd need another plugin or media store access,
          // but browser download works for now or sharing to 'Save to Files'.
      } catch (e) {
          console.error("Save failed", e);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 p-6 shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col"
      >
        <button
          onClick={() => { onClose(); resetState(); }}
          className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-slate-400 hover:text-white z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {isCreditSelectionOpen ? (
          <div className="flex-1 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setIsCreditSelectionOpen(false)} className="p-1 -ml-1 text-slate-400">
                    <X className="w-5 h-5" />
                </button>
                <h3 className="font-bold text-lg">Select Customer</h3>
            </div>

            {isAddingCustomer ? (
                <div className="flex-1 space-y-4">
                    <input
                        type="text"
                        placeholder="Customer Name"
                        value={newCustomerName}
                        onChange={e => setNewCustomerName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                    />
                    <input
                        type="tel"
                        placeholder="Phone Number"
                        value={newCustomerPhone}
                        onChange={e => setNewCustomerPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setIsAddingCustomer(false)} className="flex-1 py-3 rounded-xl bg-white/5">Cancel</button>
                        <button onClick={handleAddCustomer} className="flex-1 py-3 rounded-xl bg-emerald-500 font-bold">Save</button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                            type="text"
                            list="mobile-customer-suggestions"
                            placeholder="Search customers..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm"
                        />
                        <datalist id="mobile-customer-suggestions">
                            {customerNames.slice(0, 50).map((name, i) => <option key={i} value={name} />)}
                        </datalist>
                    </div>

                    <button
                        onClick={() => setIsAddingCustomer(true)}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 rounded-xl text-sky-400 mb-4 text-sm font-medium hover:bg-white/10"
                    >
                        <Plus className="w-4 h-4" /> Add New Customer
                    </button>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {filteredCustomers.map(c => (
                            <button
                                key={c.id}
                                onClick={() => handleSelectCustomer(c)}
                                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex justify-between items-center"
                            >
                                <div>
                                    <div className="font-bold">{c.name}</div>
                                    <div className="text-xs text-slate-400">{c.phone}</div>
                                </div>
                                {c.balance > 0 && (
                                    <span className="text-xs text-red-400 font-medium">Due: {c.balance}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
          </div>
        ) : !isSuccess ? (
          <>
            <h2 className="text-2xl font-bold text-white mb-6">Checkout</h2>

            <div className="bg-white/5 rounded-2xl p-6 mb-8 text-center">
              <span className="text-slate-400 text-sm uppercase tracking-wider block mb-1">Total to Pay</span>
              <span className="text-4xl font-bold text-emerald-400">KES {total.toLocaleString()}</span>
            </div>

            <div className="space-y-3 mb-8">
              <label className="text-sm font-medium text-slate-400 ml-1">Payment Method</label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handlePaymentSelect('cash')}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all active:scale-95",
                    paymentMethod === 'cash'
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", paymentMethod === 'cash' ? "border-emerald-500" : "border-slate-500")}>
                    {paymentMethod === 'cash' && <div className="w-2 h-2 bg-emerald-500 rounded-full" />}
                  </div>
                  <span className="font-bold">CASH</span>
                </button>

                <button
                  onClick={() => handlePaymentSelect('mpesa')}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all active:scale-95",
                    paymentMethod === 'mpesa'
                      ? "bg-green-500/20 border-green-500 text-green-400"
                      : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", paymentMethod === 'mpesa' ? "border-green-500" : "border-slate-500")}>
                    {paymentMethod === 'mpesa' && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                  </div>
                  <span className="font-bold">M-PESA</span>
                </button>

                <button
                  onClick={() => handlePaymentSelect('credit')}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all active:scale-95",
                    paymentMethod === 'credit'
                      ? "bg-orange-500/20 border-orange-500 text-orange-400"
                      : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                  )}
                >
                  <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", paymentMethod === 'credit' ? "border-orange-500" : "border-slate-500")}>
                    {paymentMethod === 'credit' && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                  </div>
                  <div className="flex-1 text-left">
                      <span className="font-bold block">CREDIT</span>
                      {selectedCustomer && <span className="text-xs text-orange-300">Customer: {selectedCustomer.name}</span>}
                  </div>
                </button>
              </div>
            </div>

            <button
              disabled={!paymentMethod || isProcessing}
              onClick={handleCheckout}
              className={cn(
                "w-full py-4 rounded-xl font-bold text-lg text-white flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100",
                isProcessing ? "bg-slate-700" : "bg-sky-500 hover:bg-sky-600 shadow-sky-500/20"
              )}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : "Complete Sale"}
            </button>
          </>
        ) : (
          <div id="success-view" className="py-12 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
             <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
               <CheckCircle className="w-10 h-10 text-emerald-500" />
             </div>
             <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
             <p className="text-slate-400 mb-6">Transaction recorded & queued.</p>

             <div className="flex flex-col gap-3 w-full">
                 <button
                    onClick={handleShareReceipt}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-sky-500 hover:bg-sky-600 rounded-xl text-white font-bold transition-colors w-full"
                 >
                     <Share2 className="w-5 h-5" />
                     Share Receipt
                 </button>
                 <button
                    onClick={handleSaveReceipt}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 font-medium transition-colors w-full"
                 >
                     <ImageIcon className="w-5 h-5" />
                     Save to Gallery
                 </button>
             </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
