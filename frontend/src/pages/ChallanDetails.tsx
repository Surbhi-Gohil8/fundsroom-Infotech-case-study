import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Check, X, FileDown, Printer, Receipt, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

import { API_BASE_URL } from '../config/api.js';

export const ChallanDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const fetchChallan = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/challans/${id}`)
      .then(res => {
        if (res.data.success) {
          setChallan(res.data.data);
        }
      })
      .catch(() => {
        setError('Sales Challan not found.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  const handleConfirm = async () => {
    setIsProcessing(true);
    setActionError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/challans/${id}/confirm`);
      if (res.data.success) {
        setShowConfirmModal(false);
        fetchChallan();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message || 'Stock verification/deduction failed.');
      setShowConfirmModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    setActionError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/challans/${id}/cancel`);
      if (res.data.success) {
        setShowCancelModal(false);
        fetchChallan();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message || 'Failed to cancel challan.');
      setShowCancelModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !challan) {
    return (
      <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 text-rose-400">
        {error || 'No sales challan data available.'}
      </div>
    );
  }

  const isDraft = challan.status === 'DRAFT';
  const isConfirmed = challan.status === 'CONFIRMED';
  const canEdit = user && ['ADMIN', 'SALES'].includes(user.role);

  const calculateSubtotal = () => {
    return challan.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Headers */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <button
          onClick={() => navigate('/challans')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm w-fit"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Challans
        </button>

        <div className="flex items-center gap-2">
          {/* Printable PDF Link */}
          <a
            href={`${API_BASE_URL}/challans/${challan.id}/pdf?token=${token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 transition-all"
          >
            <Printer className="h-3.5 w-3.5" /> Print / View PDF
          </a>

          {isDraft && canEdit && (
            <>
              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-400 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              >
                <X className="h-3.5 w-3.5" /> Cancel Draft
              </button>
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg"
              >
                <Check className="h-3.5 w-3.5" /> Confirm & Deduct Stock
              </button>
            </>
          )}

          {isConfirmed && canEdit && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-400 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              <X className="h-3.5 w-3.5" /> Reverse & Cancel
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 text-xs text-rose-400">
          {actionError}
        </div>
      )}

      {/* Invoice Redirect Ribbon */}
      {isConfirmed && challan.invoices && challan.invoices.length > 0 && (
        <div className="glass p-4 rounded-xl border-emerald-500/20 bg-emerald-950/10 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-emerald-400">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Receipt className="h-4 w-4" />
            <span>Tax Invoice {challan.invoices[0].invoiceNumber} generated!</span>
          </div>
          <Link
            to="/invoices"
            className="text-xs font-bold underline hover:text-white transition-colors"
          >
            Go to Billing Invoice
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Layout details */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">{challan.challanNumber}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Date: {new Date(challan.createdAt).toLocaleString()}</p>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              challan.status === 'CONFIRMED'
                ? 'bg-emerald-500/10 text-emerald-400'
                : challan.status === 'DRAFT'
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {challan.status}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs">
                  <th className="pb-3 font-semibold">SKU</th>
                  <th className="pb-3 font-semibold">Product Name</th>
                  <th className="pb-3 font-semibold text-right">Unit Price</th>
                  <th className="pb-3 font-semibold text-right">Quantity</th>
                  <th className="pb-3 font-semibold text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {challan.items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-3 font-mono text-xs text-slate-400">{item.skuSnapshot}</td>
                    <td className="py-3 text-white">{item.productNameSnapshot}</td>
                    <td className="py-3 text-right">INR {item.unitPriceSnapshot.toLocaleString()}</td>
                    <td className="py-3 text-right">{item.quantity}</td>
                    <td className="py-3 text-right font-bold text-slate-200">
                      INR {item.totalPrice.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-800">
            <span className="text-slate-500 text-xs">Logged by {challan.creator.name}</span>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Quantity: <span className="font-bold text-white">{challan.totalQuantity} items</span></span>
              <p className="text-base font-bold text-white mt-1">Grand Total: INR {calculateSubtotal().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Client Profile and Details Card */}
        <div className="glass p-6 rounded-2xl space-y-4 h-fit text-sm">
          <h3 className="font-bold text-white border-b border-slate-800 pb-2">Customer / Bill To</h3>
          <div className="space-y-3 text-slate-300">
            <div>
              <p className="text-xs text-slate-500">Business Name</p>
              <p className="font-semibold text-white">{challan.customer.businessName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Contact Person</p>
              <p>{challan.customer.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Mobile Phone</p>
              <p>{challan.customer.mobile}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">GSTIN</p>
              <p className="font-mono text-xs">{challan.customer.gstNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Billing Address</p>
              <p>{challan.customer.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-center space-y-4 animate-scale-up">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Confirm Challan</h3>
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
                onClick={handleConfirm}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
              >
                {isProcessing ? 'Deducting...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-center space-y-4 animate-scale-up">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Cancel Challan</h3>
              <p className="mt-2 text-xs text-slate-400">
                Are you sure you want to cancel this challan? If confirmed previously, it will reverse the stock deductions.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                {isProcessing ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChallanDetails;
