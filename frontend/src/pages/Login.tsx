import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';
import { Shield, Eye, EyeOff } from 'lucide-react';

const loginFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInput = z.infer<typeof loginFormSchema>;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormInput>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = async (data: LoginFormInput) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', data);
      if (response.data.success) {
        const { token, user } = response.data.data;
        login(token, user);
        navigate('/');
      } else {
        setErrorMsg(response.data.message || 'Login failed');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Connection to authentication server failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (email: string) => {
    setValue('email', email);
    setValue('password', 'password123');
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 glass p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div>
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Operations Portal
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Sign in to access your Mini ERP + CRM dashboard
          </p>
        </div>

        {errorMsg && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 text-sm text-rose-400">
            {errorMsg}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 rounded-md">
            <div>
              <label className="block text-sm font-medium text-slate-300">Email Address</label>
              <input
                type="email"
                {...register('email')}
                className="mt-1 block w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="block w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 pr-10 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-rose-400">{errors.password.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Demo Roles Shortcut Panel */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
            Demo Quick Login Selectors
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('admin@example.com')}
              className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 text-xs hover:bg-slate-900 hover:border-brand-500 transition-all text-slate-300"
            >
              <span className="font-bold text-brand-400">Admin Portal</span>
              <span className="text-[10px] text-slate-500">Full Access</span>
            </button>
            <button
              onClick={() => handleQuickLogin('sales@example.com')}
              className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 text-xs hover:bg-slate-900 hover:border-brand-500 transition-all text-slate-300"
            >
              <span className="font-bold text-amber-400">Sales rep</span>
              <span className="text-[10px] text-slate-500">CRM & Challans</span>
            </button>
            <button
              onClick={() => handleQuickLogin('warehouse@example.com')}
              className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 text-xs hover:bg-slate-900 hover:border-brand-500 transition-all text-slate-300"
            >
              <span className="font-bold text-emerald-400">Warehouse mgr</span>
              <span className="text-[10px] text-slate-500">Stock Ledger</span>
            </button>
            <button
              onClick={() => handleQuickLogin('accounts@example.com')}
              className="flex flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 text-xs hover:bg-slate-900 hover:border-brand-500 transition-all text-slate-300"
            >
              <span className="font-bold text-blue-400">Accounts officer</span>
              <span className="text-[10px] text-slate-500">Invoices & Financials</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;
