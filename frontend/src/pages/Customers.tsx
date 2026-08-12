import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, SlidersHorizontal, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

const API_BASE_URL = 'http://localhost:5000/api';

export const Customers: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'RETAIL',
    address: '',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCustomers = () => {
    setLoading(true);
    const params: any = { page, limit };
    if (search) params.search = search;
    if (status) params.status = status;
    if (customerType) params.customerType = customerType;

    axios.get(`${API_BASE_URL}/customers`, { params })
      .then(res => {
        if (res.data.success) {
          setCustomers(res.data.data);
          setTotal(res.data.pagination.total);
        }
      })
      .catch(() => {
        console.error('Failed to load customers');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, search, status, customerType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const payload = {
        ...formData,
        gstNumber: formData.gstNumber || null,
      };
      const res = await axios.post(`${API_BASE_URL}/customers`, payload);
      if (res.data.success) {
        setShowModal(false);
        setFormData({
          customerName: '',
          mobile: '',
          email: '',
          businessName: '',
          gstNumber: '',
          customerType: 'RETAIL',
          address: '',
          notes: '',
        });
        fetchCustomers();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to create customer');
    }
  };

  const canEdit = user && ['ADMIN', 'SALES'].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, business, email or phone..."
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
            <option value="LEAD">Leads</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <select
            value={customerType}
            onChange={(e) => { setCustomerType(e.target.value); setPage(1); }}
            className="bg-slate-900 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-brand-500"
          >
            <option value="">All Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>

          {canEdit && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-brand-600/10"
            >
              <Plus className="h-4 w-4" />
              Add Customer
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
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <User className="h-12 w-12 mx-auto text-slate-700 mb-4" />
            <p className="font-semibold text-lg text-slate-400">No Customers Found</p>
            <p className="text-sm text-slate-500">Try modifying your query or search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                  <th className="p-4 font-semibold">Business Name</th>
                  <th className="p-4 font-semibold">Customer Name</th>
                  <th className="p-4 font-semibold">Contact</th>
                  <th className="p-4 font-semibold">Type</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">GSTIN</th>
                  <th className="p-4 font-semibold">Follow-Up Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {customers.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => navigate(`/customers/${cust.id}`)}
                    className="hover:bg-slate-900/40 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-semibold text-white">{cust.businessName}</td>
                    <td className="p-4">{cust.customerName}</td>
                    <td className="p-4">
                      <p>{cust.mobile}</p>
                      <p className="text-xs text-slate-500">{cust.email}</p>
                    </td>
                    <td className="p-4 text-xs font-bold">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {cust.customerType}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cust.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : cust.status === 'LEAD'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {cust.status}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono">{cust.gstNumber || 'N/A'}</td>
                    <td className="p-4 text-slate-400 text-xs">
                      {cust.followUpDate ? new Date(cust.followUpDate).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {customers.length > 0 && (
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

      {/* Create Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-slide-in">
            <h3 className="text-lg font-bold text-white mb-4">Add New Customer</h3>
            {formError && (
              <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Business Name</label>
                  <input
                    type="text"
                    name="businessName"
                    required
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Customer Name</label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Mobile Phone</label>
                  <input
                    type="text"
                    name="mobile"
                    required
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400">GST Number (Optional)</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. 07AAAAA1111A1Z1"
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400">Customer Type</label>
                  <select
                    name="customerType"
                    value={formData.customerType}
                    onChange={handleInputChange}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Full Address</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Initial CRM Note</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
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
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Customers;
