import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  Phone,
  Mail,
  Building,
  MapPin,
  Clock,
  User,
  Plus,
  ArrowLeft,
  FileText,
  BadgeAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

import { API_BASE_URL } from '../config/api.js';

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showLogModal, setShowLogModal] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchCustomerDetails = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/customers/${id}`)
      .then((res) => {
        if (res.data.success) {
          setCustomer(res.data.data);
        }
      })
      .catch((err) => {
        setError('Customer not found or error loading data.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const handleLogFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/customers/${id}/follow-ups`, {
        note: followUpNote,
        followUpDate: new Date(followUpDate).toISOString(),
      });
      if (res.data.success) {
        setShowLogModal(false);
        setFollowUpNote('');
        setFollowUpDate('');
        fetchCustomerDetails();
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.error?.message || 'Failed to log follow-up');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 text-rose-400">
        {error || 'No customer records available.'}
      </div>
    );
  }

  const canEdit = user && ['ADMIN', 'SALES'].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Profile Card */}
        <div className="glass p-6 rounded-2xl space-y-6 h-fit">
          <div>
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-white">{customer.businessName}</h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                customer.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : customer.status === 'LEAD'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {customer.status}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
              <Building className="h-3.5 w-3.5" /> {customer.customerType} CLIENT
            </p>
          </div>

          <div className="space-y-4 border-t border-slate-800 pt-4 text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Contact Person</p>
                <p>{customer.customerName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Mobile Phone</p>
                <p>{customer.mobile}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Email Address</p>
                <p>{customer.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Address</p>
                <p>{customer.address}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <BadgeAlert className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">GSTIN / Tax ID</p>
                <p className="font-mono text-xs">{customer.gstNumber || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Next Scheduled Follow-Up</p>
                <p className="text-amber-400 font-semibold">
                  {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'No Schedule'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <p className="text-xs text-slate-500 mb-2 font-semibold uppercase">Profile Notes</p>
            <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {customer.notes || 'No notes loaded.'}
            </p>
          </div>
        </div>

        {/* Right Column: CRM Activities Log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 rounded-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand-400" /> Activity Follow-Up Timeline
              </h3>
              {canEdit && (
                <button
                  onClick={() => setShowLogModal(true)}
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Log Follow-up
                </button>
              )}
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {customer.followUps.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">No previous follow-up entries.</p>
              ) : (
                customer.followUps.map((log: any) => (
                  <div key={log.id} className="relative pl-6 border-l-2 border-slate-800 pb-4 last:pb-0">
                    <div className="absolute -left-1.5 top-1.5 h-3.5 w-3.5 rounded-full bg-brand-500/20 border-2 border-brand-500"></div>
                    <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl space-y-1.5">
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span className="font-semibold text-slate-300">Logged by {log.creator.name}</span>
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-200">{log.note}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3 text-slate-500" /> Next schedule: {new Date(log.followUpDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Challans & Invoices History */}
          <div className="glass p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-400" /> Challans & Financial Invoices
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Challans */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Related Challans</p>
                {customer.challans.length === 0 ? (
                  <p className="text-xs text-slate-500">No challans registered.</p>
                ) : (
                  <div className="space-y-2">
                    {customer.challans.map((ch: any) => (
                      <Link
                        key={ch.id}
                        to={`/challans/${ch.id}`}
                        className="flex justify-between items-center p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 text-xs transition-colors"
                      >
                        <span className="font-semibold text-slate-200">{ch.challanNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          ch.status === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : ch.status === 'DRAFT'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {ch.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Invoices */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Related Invoices</p>
                {customer.invoices.length === 0 ? (
                  <p className="text-xs text-slate-500">No invoices generated.</p>
                ) : (
                  <div className="space-y-2">
                    {customer.invoices.map((inv: any) => (
                      <Link
                        key={inv.id}
                        to="/invoices"
                        className="flex justify-between items-center p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 text-xs transition-colors"
                      >
                        <span className="font-semibold text-slate-200">{inv.invoiceNumber}</span>
                        <div className="text-right">
                          <p className="text-slate-300 font-bold">INR {inv.total.toFixed(0)}</p>
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {inv.status}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log Follow Up Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-slide-in">
            <h3 className="text-lg font-bold text-white mb-4">Log Follow-up</h3>
            {submitError && (
              <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
                {submitError}
              </div>
            )}
            <form onSubmit={handleLogFollowUp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Conversation Note / Activity Description</label>
                <textarea
                  required
                  rows={4}
                  value={followUpNote}
                  onChange={(e) => setFollowUpNote(e.target.value)}
                  placeholder="Summarize details from client phone call, meeting, email exchange..."
                  className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Next Scheduled Action Date</label>
                <input
                  type="date"
                  required
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
                >
                  Submit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerDetails;
