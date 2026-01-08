import React, { useState, useEffect } from 'react';
import { useMobileStore } from '../store/mobileStore';
import { cn } from '../lib/utils';
import { Calendar, User, ArrowLeft, RefreshCw, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

export default function ClosingReportPage() {
  const navigate = useNavigate();
  const { transactions, currentUser, businessSetup } = useMobileStore();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    generateReport(selectedDate);
  }, [selectedDate, transactions]);

  const generateReport = (dateStr: string) => {
    const dayTransactions = transactions.filter(t =>
        t.timestamp.startsWith(dateStr) && t.status === 'completed'
    );

    // Group by Cashier
    const cashierNames = [...new Set(dayTransactions.map(t => t.cashier || t.cashierName || 'Unknown'))];

    const cashiers = cashierNames.map(name => {
        const txs = dayTransactions.filter(t => (t.cashier || t.cashierName || 'Unknown') === name);
        const cashTotal = txs.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + t.total, 0);
        const mpesaTotal = txs.filter(t => t.paymentMethod === 'mpesa').reduce((sum, t) => sum + t.total, 0);
        const creditTotal = txs.filter(t => t.paymentMethod === 'credit').reduce((sum, t) => sum + t.total, 0);
        const totalSales = cashTotal + mpesaTotal + creditTotal;

        // Item Sales Aggregation
        const itemSalesMap = new Map<string, { name: string; quantity: number; total: number }>();
        txs.forEach(t => {
            t.items.forEach((item: any) => {
                const pName = item.product?.name || item.name || 'Item';
                const pPrice = item.product?.price || item.price || 0;
                const pQty = item.quantity || 0;

                if (!itemSalesMap.has(pName)) {
                    itemSalesMap.set(pName, { name: pName, quantity: 0, total: 0 });
                }
                const record = itemSalesMap.get(pName)!;
                record.quantity += pQty;
                record.total += (pQty * pPrice);
            });
        });
        const items = Array.from(itemSalesMap.values()).sort((a, b) => b.total - a.total);

        return {
            cashierName: name,
            items,
            transactions: txs,
            totalSales,
            cashTotal,
            mpesaTotal,
            creditTotal
        };
    });

    const totalCash = cashiers.reduce((sum, c) => sum + c.cashTotal, 0);
    const totalMpesa = cashiers.reduce((sum, c) => sum + c.mpesaTotal, 0);
    const totalCredit = cashiers.reduce((sum, c) => sum + c.creditTotal, 0);
    const grandTotal = totalCash + totalMpesa + totalCredit;

    setReport({
        date: dateStr,
        cashiers,
        totalCash,
        totalMpesa,
        totalCredit,
        grandTotal
    });
  };

  const handlePrintReport = async () => {
    if (!report) return;
    try {
        await api.printClosingReport(report);
        alert("Report sent to printer!");
    } catch (e) {
        alert("Failed to print report. Ensure Desktop is connected.");
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-white/10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Closing Report</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Controls */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                  <Calendar className="text-sky-400 w-5 h-5" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="bg-transparent text-white border-none focus:ring-0 w-full"
                  />
              </div>
              <button
                onClick={handlePrintReport}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-bold flex items-center justify-center gap-2"
              >
                  <Printer className="w-5 h-5" />
                  Print Report
              </button>
          </div>

          {report && (
              <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20">
                          <div className="text-emerald-400 text-xs font-bold uppercase">Grand Total</div>
                          <div className="text-2xl font-bold text-white mt-1">
                              {report.grandTotal.toLocaleString()}
                          </div>
                      </div>
                      <div className="bg-sky-500/10 p-4 rounded-xl border border-sky-500/20">
                          <div className="text-sky-400 text-xs font-bold uppercase">Total Cash</div>
                          <div className="text-xl font-bold text-white mt-1">
                              {report.totalCash.toLocaleString()}
                          </div>
                      </div>
                      <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                          <div className="text-green-400 text-xs font-bold uppercase">Total M-Pesa</div>
                          <div className="text-xl font-bold text-white mt-1">
                              {report.totalMpesa.toLocaleString()}
                          </div>
                      </div>
                      <div className="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20">
                          <div className="text-orange-400 text-xs font-bold uppercase">Total Credit</div>
                          <div className="text-xl font-bold text-white mt-1">
                              {report.totalCredit.toLocaleString()}
                          </div>
                      </div>
                  </div>

                  {/* Cashier Breakdown */}
                  {report.cashiers.map((cashier: any) => (
                      <div key={cashier.cashierName} className="bg-white/5 rounded-xl border border-white/5 overflow-hidden">
                          <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                  <User className="w-5 h-5 text-sky-400" />
                                  <span className="font-bold text-white">{cashier.cashierName}</span>
                              </div>
                              <span className="text-emerald-400 font-bold">
                                  {cashier.totalSales.toLocaleString()}
                              </span>
                          </div>

                          <div className="p-4 space-y-4">
                              {/* Payment Breakdown */}
                              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                  <div className="bg-slate-800 p-2 rounded">
                                      <div className="text-slate-400 text-[10px]">CASH</div>
                                      <div className="text-white font-mono">{cashier.cashTotal.toLocaleString()}</div>
                                  </div>
                                  <div className="bg-slate-800 p-2 rounded">
                                      <div className="text-slate-400 text-[10px]">M-PESA</div>
                                      <div className="text-white font-mono">{cashier.mpesaTotal.toLocaleString()}</div>
                                  </div>
                                  <div className="bg-slate-800 p-2 rounded">
                                      <div className="text-slate-400 text-[10px]">CREDIT</div>
                                      <div className="text-white font-mono">{cashier.creditTotal.toLocaleString()}</div>
                                  </div>
                              </div>

                              {/* Item Sales */}
                              <div>
                                  <div className="text-xs text-slate-500 uppercase font-bold mb-2">Item Sales</div>
                                  <div className="space-y-2">
                                      {cashier.items.map((item: any, idx: number) => (
                                          <div key={idx} className="flex justify-between text-sm">
                                              <span className="text-slate-300">{item.name} <span className="text-slate-500">x{item.quantity}</span></span>
                                              <span className="text-white font-mono">{item.total.toLocaleString()}</span>
                                          </div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
}
