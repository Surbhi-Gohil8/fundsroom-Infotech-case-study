import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

const API_BASE_URL = 'http://localhost:5000/api';

export const Challans: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [challans, setChallans] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchChallans = () => {
    setLoading(true);
    const params: any = { page, limit, sortBy: 'createdAt', sortOrder: 'desc' };
    if (search) params.search = search;
    if (status) params.status = status;

    axios.get(`${API_BASE_URL}/challans`, { params })
      .then(res => {
        if (res.data.success) {
          setChallans(res.data.data);
          setTotal(res.data.pagination.total);
        }
      })
      .catch(() => {
        console.error('Failed to load challans');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChallans();
  }, [page, search, status]);

  const canCreate = user && ['ADMIN', 'SALES'].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by challan number, client..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-sm"
          />
        </div>

        <div className="flex gap-3 items-center">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {canCreate && (
            <button
              onClick={() => navigate('/challans/new')}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg"
            >
              <Plus className="h-4 w-4" />
              New Challan
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent mx-auto"></div>
          </div>
        ) : challans.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="h-12 w-12 mx-auto text-slate-700 mb-4" />
            <p className="font-semibold text-lg text-slate-400">No Challans Found</p>
            <p className="text-sm text-slate-500">Create a new sales challan draft.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                  <th className="p-4 font-semibold">Challan Number</th>
                  <th className="p-4 font-semibold">Client Name</th>
                  <th className="p-4 font-semibold">Quantity</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Created By</th>
                  <th className="p-4 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {challans.map((ch) => (
                  <tr
                    key={ch.id}
                    onClick={() => navigate(`/challans/${ch.id}`)}
                    className="hover:bg-slate-900/20 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-bold text-white">{ch.challanNumber}</td>
                    <td className="p-4">{ch.customer.businessName}</td>
                    <td className="p-4">{ch.totalQuantity} items</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ch.status === 'CONFIRMED'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : ch.status === 'DRAFT'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {ch.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-400">{ch.creator.name}</td>
                    <td className="p-4 text-xs text-slate-500">{new Date(ch.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {challans.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} records
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page * limit >= total}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default Challans;
