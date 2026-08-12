import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ShieldAlert, ArrowLeft, Check, AlertCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

interface LineItem {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  availableStock: number;
  quantity: number;
}

export const CreateChallan: React.FC = () => {
  const navigate = useNavigate();
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  
  // Picker helper
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductQty, setSelectedProductQty] = useState(1);
  
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    // Load customers list
    axios.get(`${API_BASE_URL}/customers`, { params: { limit: 100 } })
      .then(res => {
        if (res.data.success) {
          setCustomers(res.data.data);
        }
      });

    // Load active products list
    axios.get(`${API_BASE_URL}/products`, { params: { limit: 100 } })
      .then(res => {
        if (res.data.success) {
          setProducts(res.data.data.filter((p: any) => p.isActive));
        }
      });
  }, []);

  const handleAddLineItem = () => {
    if (!selectedProductId) return;

    // Check duplicate
    if (lineItems.some(item => item.productId === selectedProductId)) {
      setSubmitError('This product is already added as a line item.');
      return;
    }

    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    setLineItems([
      ...lineItems,
      {
        productId: prod.id,
        name: prod.name,
        sku: prod.sku,
        unitPrice: prod.unitPrice,
        availableStock: prod.currentStock,
        quantity: selectedProductQty,
      }
    ]);
    setSelectedProductId('');
    setSelectedProductQty(1);
    setSubmitError(null);
  };

  const handleUpdateQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...lineItems];
    updated[index].quantity = newQty;
    setLineItems(updated);
  };

  const handleRemoveLine = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const calculateGrandTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const calculateTotalQty = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleSaveChallan = async (isConfirmFlow: boolean) => {
    if (!selectedCustomerId) {
      setSubmitError('Please select a customer.');
      return;
    }
    if (lineItems.length === 0) {
      setSubmitError('Please add at least one product line item.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        customerId: selectedCustomerId,
        items: lineItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      };

      // 1. Create Draft Challan
      const createRes = await axios.post(`${API_BASE_URL}/challans`, payload);
      
      if (createRes.data.success) {
        const challan = createRes.data.data;
        
        // 2. If CONFIRM flow selected, confirm it in sequence
        if (isConfirmFlow) {
          try {
            const confirmRes = await axios.post(`${API_BASE_URL}/challans/${challan.id}/confirm`);
            if (confirmRes.data.success) {
              navigate('/challans');
            }
          } catch (confirmErr: any) {
            setSubmitError(confirmErr.response?.data?.error?.message || 'Challan created as DRAFT, but confirmation failed.');
            setShowConfirmModal(false);
          }
        } else {
          // Saved as draft successfully
          navigate('/challans');
        }
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.error?.message || 'Failed to save challan details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/challans')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Challans
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Build details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Select Customer Account</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-400">Customer</label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="">-- Choose Customer Business --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.businessName} ({c.customerName})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Add Product Items</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400">Search Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="">-- Choose Product SKU --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku} | Stock: {p.currentStock})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="w-20">
                  <label className="block text-xs font-semibold text-slate-400">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={selectedProductQty}
                    onChange={(e) => setSelectedProductQty(Number(e.target.value))}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Add Item
                </button>
              </div>
            </div>
          </div>

          {/* Line items list */}
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-base">Challan Line Items</h3>
            {lineItems.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No product items added to challan line yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-xs">
                      <th className="pb-3 font-semibold">Product SKU</th>
                      <th className="pb-3 font-semibold">Unit Price</th>
                      <th className="pb-3 font-semibold">Qty</th>
                      <th className="pb-3 font-semibold">Total Price</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {lineItems.map((item, index) => {
                      const stockWarning = item.quantity > item.availableStock;
                      return (
                        <tr key={item.productId}>
                          <td className="py-3">
                            <span className="font-bold text-white">{item.sku}</span>
                            <p className="text-xs text-slate-400 max-w-[200px] line-clamp-1">{item.name}</p>
                            {stockWarning && (
                              <span className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold mt-0.5 animate-pulse">
                                <ShieldAlert className="h-3 w-3" /> Exceeds stock ({item.availableStock} available)
                              </span>
                            )}
                          </td>
                          <td className="py-3">INR {item.unitPrice.toLocaleString()}</td>
                          <td className="py-3">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => handleUpdateQty(index, Number(e.target.value))}
                              className="w-16 bg-slate-950 border border-slate-800 px-2 py-1 rounded text-xs text-white focus:outline-none"
                            />
                          </td>
                          <td className="py-3 font-bold text-slate-200">
                            INR {(item.unitPrice * item.quantity).toLocaleString()}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleRemoveLine(index)}
                              className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Summaries & Actions */}
        <div className="space-y-6">
          <div className="glass p-6 rounded-2xl space-y-6">
            <h3 className="font-bold text-white text-base">Summary</h3>
            {submitError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
                {submitError}
              </div>
            )}
            <div className="space-y-3 text-sm border-b border-slate-800 pb-4">
              <div className="flex justify-between text-slate-400">
                <span>Total Items</span>
                <span>{calculateTotalQty()} units</span>
              </div>
              <div className="flex justify-between font-bold text-white text-lg">
                <span>Subtotal</span>
                <span>INR {calculateGrandTotal().toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleSaveChallan(false)}
                disabled={isSubmitting}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-sm font-semibold transition-all"
              >
                Save as Draft
              </button>
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isSubmitting}
                className="w-full bg-brand-600 hover:bg-brand-500 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-600/10"
              >
                Confirm & Deduct Stock
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Confirm Stock Deduction</h3>
              <p className="mt-2 text-xs text-slate-400">
                Confirming this challan will deduct stock permanently and generate an invoice. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => handleSaveChallan(true)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
              >
                {isSubmitting ? 'Confirming...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CreateChallan;
