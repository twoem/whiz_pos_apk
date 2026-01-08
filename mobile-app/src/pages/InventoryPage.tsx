import React, { useMemo, useState } from 'react';
import { useMobileStore } from '../store/mobileStore';
import { cn } from '../lib/utils';
import { ArrowLeft, Search, Package, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function InventoryPage() {
  const navigate = useNavigate();
  const { products, categories, connection } = useMobileStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-900 border-b border-white/10 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Inventory</h1>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {['All', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  selectedCategory === cat
                    ? "bg-sky-500 text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredProducts.map(product => (
              <div key={product.id} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={product.image ? `${connection.apiUrl}/assets/${product.image}` : '/cart.png'}
                        onError={(e) => { (e.target as HTMLImageElement).src = '/cart.png'; }}
                        className="w-full h-full object-cover"
                      />
                  </div>
                  <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{product.name}</h3>
                      <div className="text-xs text-slate-400">{product.category}</div>
                  </div>
                  <div className="text-right">
                      <div className="font-mono text-emerald-400 font-bold">
                          {(product.stock || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500">In Stock</div>
                  </div>
                  {(product.stock || 0) <= (product.minStock || 5) && (
                      <div className="w-2 h-2 rounded-full bg-red-500" title="Low Stock" />
                  )}
              </div>
          ))}

          {filteredProducts.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No products found</p>
              </div>
          )}
      </div>
    </div>
  );
}
