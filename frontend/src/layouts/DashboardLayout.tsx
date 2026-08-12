import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import {
  LayoutDashboard,
  Users,
  Package,
  History,
  FileSpreadsheet,
  Receipt,
  UserCog,
  LogOut,
  Menu,
  X,
  User as UserIcon
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'SALES', 'ACCOUNTS']
    },
    {
      label: 'Customers (CRM)',
      path: '/customers',
      icon: Users,
      roles: ['ADMIN', 'SALES', 'ACCOUNTS']
    },
    {
      label: 'Products',
      path: '/products',
      icon: Package,
      roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']
    },
    {
      label: 'Stock Ledger',
      path: '/inventory',
      icon: History,
      roles: ['ADMIN', 'WAREHOUSE']
    },
    {
      label: 'Sales Challans',
      path: '/challans',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'SALES', 'ACCOUNTS']
    },
    {
      label: 'Invoices',
      path: '/invoices',
      icon: Receipt,
      roles: ['ADMIN', 'ACCOUNTS']
    },
    {
      label: 'User Management',
      path: '/users',
      icon: UserCog,
      roles: ['ADMIN']
    }
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    SALES: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    WAREHOUSE: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    ACCOUNTS: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 overflow-hidden text-slate-100">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-900 border-r border-slate-800 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
            <span className="bg-brand-600 p-1.5 rounded-lg text-white font-black">ERP</span>
            <span>Operations Portal</span>
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/80 backdrop-blur-sm">
          <aside className="w-64 bg-slate-900 h-full flex flex-col border-r border-slate-800 animate-slide-in">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <span className="text-lg font-bold text-white tracking-wider flex items-center gap-2">
                <span className="bg-brand-600 p-1.5 rounded-lg text-white font-black">ERP</span>
                <span>Operations</span>
              </span>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {filteredNavItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-lg'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-slate-400 hover:text-white focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-semibold text-white">
              {filteredNavItems.find(item => item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path)))?.label || 'Operations'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${roleColors[user.role]}`}>
                {user.role}
              </span>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <UserIcon className="h-4 w-4 text-slate-400" />
              <span className="hidden sm:inline font-medium">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page mount */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
