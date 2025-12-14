import React, { useState, useMemo } from 'react';
import { useMobileStore } from '../store/mobileStore';
import { cn } from '../lib/utils';
import { ShoppingCart, Search, Menu, LogOut, RefreshCw, X, Receipt, DollarSign, Users, Settings, Trash2, Plus, Minus, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import CheckoutModal from '../components/CheckoutModal';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    currentUser,
    products,
    categories,
    cart,
    addToCart,
    updateCartQuantity,
    clearCart,
    connection,
    logout,
    syncQueue
  } = useMobileStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSync = async () => {
    try {
      // Manual trigger for push/pull
      const pullData = await api.syncPull();
      // Update store logic here... (omitted for brevity, assume similar to connection screen)
    } catch (e) {
      console.error("Sync failed", e);
    }
  };

  const handleNavigate = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
      {/* Top Bar */}
      <header className="h-16 px-4 flex items-center justify-between bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMenuOpen(true)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <Menu className="w-6 h-6 text-white" />
          </button>
          {!isSearchOpen && (
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-white leading-none">Whiz Pos</h1>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
          )}
        </div>

        {isSearchOpen ? (
          <div className="flex-1 mx-4">
            <div className="relative">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-white/10 border border-white/10 rounded-full py-2 pl-4 pr-10 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                onBlur={() => !searchQuery && setIsSearchOpen(false)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={cn("p-2 rounded-full hover:bg-white/10 transition-colors", isSearchOpen ? "text-sky-400" : "text-slate-400")}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Categories */}
      <div className="py-3 px-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-white/5 bg-slate-900/50">
        {['All', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              selectedCategory === cat
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden flex flex-col text-left active:scale-95 transition-transform group"
            >
              <div className="aspect-[4/3] bg-slate-800 relative">
                <img
                  src={product.image
                    ? `${connection.apiUrl}/assets/${product.image}`
                    : '/cart.png'
                  }
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/cart.png'; // Fallback
                  }}
                  alt={product.name}
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
                {product.stock < 10 && (
                  <span className="absolute top-2 right-2 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {product.stock} Left
                  </span>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-bold text-white text-sm line-clamp-1">{product.name}</h3>
                <p className="text-sky-400 text-sm font-semibold mt-1">KES {product.price.toLocaleString()}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Floater / Sheet */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="absolute bottom-4 left-4 right-4 z-30"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-emerald-500 text-white p-4 rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-between backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 px-3 py-1 rounded-lg font-bold">
                  {cartCount}
                </div>
                <span className="font-medium text-emerald-50">View Cart</span>
              </div>
              <span className="font-bold text-lg">KES {cartTotal.toLocaleString()}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Sheet Content */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col justify-end"
            onClick={() => setIsCartOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-slate-900 rounded-t-3xl border-t border-white/10 max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Current Order</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => { clearCart(); setIsCartOpen(false); }}
                    className="p-2 bg-red-500/10 text-red-400 rounded-full hover:bg-red-500/20 transition-colors"
                    title="Clear Cart"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button onClick={() => setIsCartOpen(false)} className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.map(item => (
                  <div key={item.cartId} className="flex gap-4 items-center bg-white/5 p-3 rounded-xl border border-white/5">
                    <div className="w-16 h-16 rounded-lg bg-slate-800 overflow-hidden shrink-0">
                      <img
                        src={item.image ? `${connection.apiUrl}/assets/${item.image}` : '/cart.png'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate">{item.name}</h4>
                      <div className="text-sky-400 text-sm mt-1">KES {item.price}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-3 bg-slate-800 rounded-lg p-1">
                        <button
                          onClick={() => updateCartQuantity(item.cartId, item.quantity - 1)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-bold text-white w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.cartId, item.quantity + 1)}
                          className="p-1 rounded hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-bold text-white text-sm">{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-900 border-t border-white/10 safe-area-pb">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-slate-400">Total Amount</span>
                  <span className="text-2xl font-bold text-white">KES {cartTotal.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Proceed to Checkout
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-slate-900 border-r border-white/10 z-50 p-6 shadow-2xl flex flex-col"
          >
             <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-xl font-bold text-white">
                 {currentUser?.name?.charAt(0)}
               </div>
               <div>
                 <div className="font-bold text-white">{currentUser?.name}</div>
                 <div className="text-xs text-slate-400 capitalize">{currentUser?.role}</div>
               </div>
             </div>

             <nav className="space-y-2 flex-1">
               <button onClick={() => handleNavigate('/transactions')} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                 <Receipt className="w-5 h-5" /> Transactions
               </button>
               <button onClick={() => handleNavigate('/expenses')} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                 <DollarSign className="w-5 h-5" /> Expenses
               </button>
               <button onClick={() => handleNavigate('/reports')} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                 <BarChart3 className="w-5 h-5" /> Reports
               </button>
               <button onClick={() => handleNavigate('/credit-customers')} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                 <Users className="w-5 h-5" /> Credit Customers
               </button>
               {currentUser?.role === 'admin' && (
                 <button onClick={() => handleNavigate('/salaries')} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                   <DollarSign className="w-5 h-5" /> Salaries
                 </button>
               )}
               <button onClick={() => handleNavigate('/pending-sync')} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                 <RefreshCw className="w-5 h-5" /> Sync Status
                 {syncQueue.length > 0 && <span className="ml-auto bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{syncQueue.length}</span>}
               </button>
             </nav>

             <div className="pt-4 border-t border-white/10 space-y-2">
                <button onClick={() => handleNavigate('/settings')} className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-300 hover:bg-white/5 hover:text-white transition-colors">
                  <Settings className="w-5 h-5" /> Settings
                </button>
                <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
                  <LogOut className="w-5 h-5" /> Logout
                </button>
             </div>

             <button onClick={() => setIsMenuOpen(false)} className="absolute top-4 right-4 p-2 text-slate-500">
               <X className="w-6 h-6" />
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          total={cartTotal}
        />
      )}
    </div>
  );
}
