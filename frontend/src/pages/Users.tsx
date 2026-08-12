import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, UserCheck, UserX, ShieldAlert, Key } from 'lucide-react';

const API_BASE_URL = 'process.env.VITE_API_URL/api';

export const Users: React.FC = () => {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES',
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/auth/users`)
      .then(res => {
        if (res.data.success) {
          setUsersList(res.data.data);
        }
      })
      .catch(() => {
        setError('Failed to fetch user list details.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.name === 'isActive' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: val });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/users`, formData);
      if (res.data.success) {
        setShowModal(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'SALES',
          isActive: true,
        });
        fetchUsers();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to create user record.');
    }
  };

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/auth/users/${id}`, {
        isActive: !currentActive,
      });
      if (res.data.success) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to toggle status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Key className="h-5 w-5 text-brand-400" /> Platform Users
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-lg"
        >
          <Plus className="h-4 w-4" /> Create User Account
        </button>
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
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400">
                  <th className="p-4 font-semibold">Name</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Joined Date</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {usersList.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="p-4 font-bold text-white">{usr.name}</td>
                    <td className="p-4">{usr.email}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-850 bg-slate-800 text-slate-300">
                        {usr.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        usr.isActive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {usr.isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                        {usr.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-500">{new Date(usr.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(usr.id, usr.isActive)}
                        className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                          usr.isActive
                            ? 'text-rose-400 border-rose-900/30 hover:bg-rose-500/10'
                            : 'text-emerald-400 border-emerald-900/30 hover:bg-emerald-500/10'
                        }`}
                      >
                        {usr.isActive ? 'Disable User' : 'Enable User'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative animate-slide-in">
            <h3 className="text-lg font-bold text-white mb-4">Create User Account</h3>
            {formError && (
              <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400">Full Name</label>
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

              <div>
                <label className="block text-xs font-semibold text-slate-400">Initial Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="At least 6 characters"
                  className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400">Platform Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SALES">Sales</option>
                  <option value="WAREHOUSE">Warehouse</option>
                  <option value="ACCOUNTS">Accounts</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="rounded bg-slate-950 border-slate-800 text-brand-650 focus:ring-brand-500 h-4 w-4"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-300 cursor-pointer">
                  Activate account immediately
                </label>
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
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Users;
