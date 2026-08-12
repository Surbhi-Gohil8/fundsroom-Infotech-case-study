import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, ArrowUpRight, ArrowDownLeft, History, RefreshCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

import { API_BASE_URL } from '../config/api.js';

export const Inventory: React.FC = () => {
  const { user } = useAuth();
  
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [movementType, setMovementType] = useState('');
  const [productIdFilter, setProductIdFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Form Adjustment State
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustData, setAdjustData] = useState({
    productId: '',
    quantity: '',
    movementType: 'IN',
    reason: '',
  });
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const fetchMovements = () => {
    setLoading(true);
    const params: any = { page, limit };
    if (search) params.search = search;
    if (movementType) params.movementType = movementType;
    if (productIdFilter) params.productId = productIdFilter;

    axios.get(`${API_BASE_URL}/products/stock-movements`, { params })
      .then(res => {
        if (res.data.success) {
          setMovements(res.data.data);
          setTotal(res.data.pagination.total);
        }
      })
      .catch(() => {
        console.error('Failed to load stock movements');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchAllProductsList = () => {
    // Simply fetch first 100 products for dropdown selection
    axios.get(`${API_BASE_URL}/products`, { params: { limit: 100 } })
      .then(res => {
        if (res.data.success) {
          setProducts(res.data.data);
        }
      });
  };

  useEffect(() => {
    fetchMovements();
  }, [page, search, movementType, productIdFilter]);

  useEffect(() => {
    fetchAllProductsList();
  }, []);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/products/${adjustData.productId}/stock`, {
        quantity: Number(adjustData.quantity),
        movementType: adjustData.movementType,
        reason: adjustData.reason,
      });

      if (res.data.success) {
        setShowAdjustModal(false);
        setAdjustData({
          productId: '',
          quantity: '',
          movementType: 'IN',
          reason: '',
        });
        fetchMovements();
      }
    } catch (err: any) {
      setAdjustError(err.response?.data?.error?.message || 'Failed to submit adjustment log');
    }
  };

  const canAdjust = user && ['ADMIN', 'WAREHOUSE'].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by SKU, product name, or adjustment reason..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
          />
        </div>

        <div className="flex gap-3 items-center">
          <select
            value={productIdFilter}
            onChange={(e) => { setProductIdFilter(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-brand-500 max-w-[200px]"
          >
            <option value="">All Products</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>

          <select
            value={movementType}
            onChange={(e) => { setMovementType(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-brand-500"
          >
            <option value="">All Movements</option>
            <option value="IN">IN (Stock Addition)</option>
            <option value="OUT">OUT (Stock Deduction)</option>
          </select>

          {canAdjust && (
            <button
              onClick={() => setShowAdjustModal(true)}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Adjust Stock
            </button>
          )}
        </div>
      </div>

      {/* Movements Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mx-auto"></div>
          </div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <History className="h-12 w-12 mx-auto text-slate-700 mb-4" />
            <p className="font-semibold text-lg text-slate-400">Ledger Empty</p>
            <p className="text-sm text-slate-500">No stock movements recorded in the system.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                  <th className="p-4 font-semibold">Date & Time</th>
                  <th className="p-4 font-semibold">SKU / Product</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Change Qty</th>
                  <th className="p-4 font-semibold">Ledger Reason</th>
                  <th className="p-4 font-semibold">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {movements.map((move) => {
                  const isIN = move.movementType === 'IN';
                  return (
                    <tr key={move.id} className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-4 text-xs text-slate-500">
                        {new Date(move.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-xs text-slate-400">{move.product.sku}</div>
                        <div className="font-semibold text-white">{move.product.name}</div>
                      </td>
                      <td className="p-4 text-slate-400">{move.product.category}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 font-bold text-xs ${isIN ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isIN ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownLeft className="h-3.5 w-3.5" />}
                          {isIN ? '+' : '-'}{move.quantityChanged}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300 text-xs italic">{move.reason}</td>
                      <td className="p-4 text-slate-400 text-xs">{move.creator.name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-slide-in">
            <h3 className="text-lg font-bold text-white mb-4">Record Stock Ledger Entry</h3>
            {adjustError && (
              <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
                {adjustError}
              </div>
            )}
            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Select Product</label>
                <select
                  required
                  value={adjustData.productId}
                  onChange={(e) => setAdjustData({ ...adjustData, productId: e.target.value })}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Choose SKU --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Available: {p.currentStock})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Adjust Quantity</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={adjustData.quantity}
                    onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Adjustment Type</label>
                  <select
                    value={adjustData.movementType}
                    onChange={(e) => setAdjustData({ ...adjustData, movementType: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="IN">IN (Purchase / Return)</option>
                    <option value="OUT">OUT (Wastage / Defect)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Ledger Explanation / Reason</label>
                <input
                  type="text"
                  required
                  value={adjustData.reason}
                  onChange={(e) => setAdjustData({ ...adjustData, reason: e.target.value })}
                  placeholder="e.g. Purchase order PO-221, Damaged package"
                  className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
                >
                  Apply Stock Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Inventory;
