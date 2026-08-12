import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  Package,
  FileText,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

const API_BASE_URL = 'http://localhost:5000/api';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`${API_BASE_URL}/dashboard/summary`)
      .then(res => {
        if (res.data.success) {
          setData(res.data.data);
        }
      })
      .catch(err => {
        setError('Failed to fetch dashboard summary.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 text-rose-400">
        {error || 'No dashboard data available.'}
      </div>
    );
  }

  const { counts, recentChallans, recentCustomers, followUps } = data;

  // Pie chart data
  const customerPieData = [
    { name: 'Active', value: counts.customers.active },
    { name: 'Leads', value: counts.customers.leads },
  ];
  const COLORS = ['#10b981', '#f59e0b'];

  // Bar chart data for stock levels
  const stockChartData = [
    { name: 'Total Products', val: counts.products.total, color: '#6366f1' },
    { name: 'Low Stock', val: counts.products.lowStock, color: '#f59e0b' },
    { name: 'Out of Stock', val: counts.products.outOfStock, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="glass p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-brand-500/10 rounded-xl text-brand-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Total Customers</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{counts.customers.total}</h3>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-emerald-400 font-semibold">{counts.customers.active} Active</span> | {counts.customers.leads} Leads
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Total Inventory</p>
            <h3 className="text-2xl font-bold mt-1 text-white">{counts.products.total} SKU</h3>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-amber-400 font-semibold">{counts.products.lowStock} Low</span> | <span className="text-rose-400 font-semibold">{counts.products.outOfStock} Out</span>
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Sales Challans</p>
            <h3 className="text-2xl font-bold mt-1 text-white">
              {counts.challans.confirmed + counts.challans.draft}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              <span className="text-indigo-400 font-semibold">{counts.challans.confirmed} Confirmed</span> | {counts.challans.draft} Drafts
            </p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Sales Revenue</p>
            <h3 className="text-2xl font-bold mt-1 text-white">
              INR {counts.revenue.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              GST (18%) included | Excl. Cancelled
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Alerts Banner for CRM Follow-ups and Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-5 rounded-2xl">
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Customer Pipeline Split</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {customerPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl">
              <h4 className="text-sm font-semibold text-slate-300 mb-4">Stock Ledger Status</h4>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="val" fill="#3b82f6">
                      {stockChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent lists */}
          <div className="glass p-6 rounded-2xl space-y-4">
            <h4 className="text-sm font-semibold text-slate-300">Recent Sales Challans</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Challan Number</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Items Qty</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recentChallans.map((ch: any) => (
                    <tr key={ch.id}>
                      <td className="py-3 font-medium text-white">{ch.challanNumber}</td>
                      <td className="py-3">{ch.customer.businessName}</td>
                      <td className="py-3">{ch.totalQuantity} items</td>
                      <td className="py-3">
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
                      <td className="py-3 text-slate-500">{new Date(ch.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* CRM Tasks & Alerts */}
        <div className="space-y-6">
          {/* Overdue Alerts */}
          <div className="glass p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>Overdue Follow-ups ({followUps.overdue.length})</span>
            </div>
            <div className="mt-3 space-y-3">
              {followUps.overdue.length === 0 ? (
                <p className="text-xs text-slate-500">No overdue customer tasks.</p>
              ) : (
                followUps.overdue.slice(0, 3).map((cust: any) => (
                  <div key={cust.id} className="text-xs border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                    <p className="font-bold text-slate-200">{cust.customerName}</p>
                    <p className="text-slate-400">{cust.businessName}</p>
                    <p className="text-rose-400/80 mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Due {new Date(cust.followUpDate).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Due Today Follow ups */}
          <div className="glass p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Calendar className="h-4 w-4" />
              <span>Follow-ups Due Today ({followUps.dueToday.length})</span>
            </div>
            <div className="mt-3 space-y-3">
              {followUps.dueToday.length === 0 ? (
                <p className="text-xs text-slate-500">No follow-ups schedule for today.</p>
              ) : (
                followUps.dueToday.slice(0, 3).map((cust: any) => (
                  <div key={cust.id} className="text-xs border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                    <p className="font-bold text-slate-200">{cust.customerName}</p>
                    <p className="text-slate-400">{cust.businessName}</p>
                    <p className="text-amber-400/80 mt-0.5 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Action item today
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Customers */}
          <div className="glass p-5 rounded-2xl">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Recently Added Leads</h4>
            <div className="space-y-3">
              {recentCustomers.map((cust: any) => (
                <div key={cust.id} className="text-xs flex justify-between items-center border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold text-slate-200">{cust.customerName}</p>
                    <p className="text-slate-500">{cust.businessName}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-semibold text-slate-400">
                    {cust.customerType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
