import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Package, Edit2, AlertTriangle, ShieldAlert, CheckCircle, Image } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

const API_BASE_URL = 'http://localhost:5000/api';

export const Products: React.FC = () => {
  const { user } = useAuth();
  
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: '',
    currentStock: '0',
    minimumStock: '5',
    warehouseLocation: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProducts = () => {
    setLoading(true);
    const params: any = { page, limit, sortBy: 'createdAt', sortOrder: 'desc' };
    if (search) params.search = search;
    if (category) params.category = category;
    if (stockStatus) params.stockStatus = stockStatus;

    axios.get(`${API_BASE_URL}/products`, { params })
      .then(res => {
        if (res.data.success) {
          setProducts(res.data.data);
          setTotal(res.data.pagination.total);
        }
      })
      .catch(() => {
        console.error('Failed to load products');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, category, stockStatus]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      sku: '',
      category: '',
      unitPrice: '',
      currentStock: '0',
      minimumStock: '5',
      warehouseLocation: '',
    });
    setSelectedFile(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (prod: any) => {
    setEditingId(prod.id);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      category: prod.category,
      unitPrice: String(prod.unitPrice),
      currentStock: String(prod.currentStock),
      minimumStock: String(prod.minimumStock),
      warehouseLocation: prod.warehouseLocation,
    });
    setSelectedFile(null);
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('sku', formData.sku);
    data.append('category', formData.category);
    data.append('unitPrice', formData.unitPrice);
    data.append('currentStock', formData.currentStock);
    data.append('minimumStock', formData.minimumStock);
    data.append('warehouseLocation', formData.warehouseLocation);
    if (selectedFile) {
      data.append('image', selectedFile);
    }

    try {
      let res;
      if (editingId) {
        res = await axios.patch(`${API_BASE_URL}/products/${editingId}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post(`${API_BASE_URL}/products`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.success) {
        setShowModal(false);
        fetchProducts();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to submit product details.');
    }
  };

  const isAdmin = user && user.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
          />
        </div>

        <div className="flex gap-3 items-center">
          <select
            value={stockStatus}
            onChange={(e) => { setStockStatus(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-brand-500"
          >
            <option value="">All Stocks</option>
            <option value="HEALTHY">Healthy</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          {isAdmin && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mx-auto"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            <Package className="h-12 w-12 mx-auto text-slate-700 mb-4 animate-pulse" />
            <p className="font-semibold text-lg text-slate-400">No Products Registered</p>
            <p className="text-sm text-slate-500">Check filters or create a new inventory record.</p>
          </div>
        ) : (
          products.map((prod) => {
            const isOutOfStock = prod.currentStock === 0;
            const isLowStock = prod.currentStock <= prod.minimumStock && !isOutOfStock;

            let statusBadge = (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                <CheckCircle className="h-3 w-3" /> Healthy Stock
              </span>
            );
            if (isOutOfStock) {
              statusBadge = (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/20">
                  <ShieldAlert className="h-3 w-3 animate-pulse" /> Out of Stock
                </span>
              );
            } else if (isLowStock) {
              statusBadge = (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                  <AlertTriangle className="h-3 w-3" /> Low Stock Warning
                </span>
              );
            }

            // Image URL logic
            const displayImgUrl = prod.imageUrl
              ? (prod.imageUrl.startsWith('/uploads/') ? `http://localhost:5000${prod.imageUrl}` : prod.imageUrl)
              : null;

            return (
              <div key={prod.id} className="glass p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-slate-800 transition-colors">
                <div className="space-y-3">
                  <div className="flex gap-4">
                    {/* Render Product Image or placeholder */}
                    <div className="h-16 w-16 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-slate-600">
                      {displayImgUrl ? (
                        <img src={displayImgUrl} alt={prod.name} className="h-full w-full object-cover" />
                      ) : (
                        <Image className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-mono tracking-wider">{prod.sku}</div>
                      <h4 className="font-bold text-white text-base line-clamp-1">{prod.name}</h4>
                      <span className="text-xs text-slate-400">{prod.category}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-950/50 p-3 rounded-xl border border-slate-900/50 text-xs">
                    <div>
                      <span className="text-slate-500">Unit Price</span>
                      <p className="font-bold text-slate-200 mt-0.5">INR {prod.unitPrice.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Stock Count</span>
                      <p className={`font-bold mt-0.5 ${isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-slate-200'}`}>
                        {prod.currentStock} / {prod.minimumStock} min
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Location: <span className="font-mono font-semibold text-slate-300">{prod.warehouseLocation}</span></span>
                    {statusBadge}
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => handleOpenEdit(prod)}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 py-2 rounded-xl text-xs font-semibold text-slate-300 transition-all"
                  >
                    <Edit2 className="h-3 w-3" /> Edit Product
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-slide-in">
            <h3 className="text-lg font-bold text-white mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
            {formError && (
              <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">SKU (Unique)</label>
                  <input
                    type="text"
                    name="sku"
                    required
                    value={formData.sku}
                    onChange={handleInputChange}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Category</label>
                  <input
                    type="text"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g. Electronics, Accessories"
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Unit Price (INR)</label>
                  <input
                    type="number"
                    name="unitPrice"
                    required
                    value={formData.unitPrice}
                    onChange={handleInputChange}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Initial Stock</label>
                  <input
                    type="number"
                    name="currentStock"
                    disabled={!!editingId} // In existing products, stock adjustments should be logged through stock ledger page
                    value={formData.currentStock}
                    onChange={handleInputChange}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500 disabled:opacity-40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Min Alert Stock</label>
                  <input
                    type="number"
                    name="minimumStock"
                    required
                    value={formData.minimumStock}
                    onChange={handleInputChange}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Location (Bay/Row)</label>
                  <input
                    type="text"
                    name="warehouseLocation"
                    required
                    value={formData.warehouseLocation}
                    onChange={handleInputChange}
                    placeholder="e.g. A-12, B-03"
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Product Image File</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 file:cursor-pointer"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
                >
                  Submit Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Products;
