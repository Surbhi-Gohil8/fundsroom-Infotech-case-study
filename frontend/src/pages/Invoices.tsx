import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Receipt, Printer, Landmark } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

const API_BASE_URL = 'http://localhost:5000/api';

export const Invoices: React.FC = () => {
  const { user, token } = useAuth();
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/invoices`)
      .then(res => {
        if (res.data.success) {
          setInvoices(res.data.data);
        }
      })
      .catch(() => {
        setError('Failed to load financial invoices.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Receipt className="h-5 w-5 text-brand-400" /> Billing tax Invoices
        </h2>
      </div>

      {/* Main Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mx-auto"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 text-xs text-rose-400">
            {error}
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Landmark className="h-12 w-12 mx-auto text-slate-700 mb-4" />
            <p className="font-semibold text-lg text-slate-400">No Invoices Registered</p>
            <p className="text-sm text-slate-500">Invoices are automatically created upon Challan confirmation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                  <th className="p-4 font-semibold">Invoice No</th>
                  <th className="p-4 font-semibold">Related Challan</th>
                  <th className="p-4 font-semibold">Customer Business</th>
                  <th className="p-4 font-semibold text-right">Subtotal</th>
                  <th className="p-4 font-semibold text-right">GST (18%)</th>
                  <th className="p-4 font-semibold text-right">Grand Total</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="p-4 font-bold text-white">{inv.invoiceNumber}</td>
                    <td className="p-4 font-mono text-xs text-slate-400">{inv.challan.challanNumber}</td>
                    <td className="p-4">{inv.customer.businessName}</td>
                    <td className="p-4 text-right">INR {inv.subtotal.toLocaleString()}</td>
                    <td className="p-4 text-right">INR {inv.tax.toLocaleString()}</td>
                    <td className="p-4 text-right font-bold text-white">INR {inv.total.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : inv.status === 'UNPAID'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <a
                        href={`${API_BASE_URL}/invoices/${inv.id}/pdf?token=${token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 transition-all"
                      >
                        <Printer className="h-3 w-3" /> Invoice PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default Invoices;
