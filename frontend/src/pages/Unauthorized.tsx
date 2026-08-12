import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-center text-white">
      <ShieldAlert className="h-16 w-16 text-rose-500 animate-bounce" />
      <h1 className="mt-6 text-3xl font-extrabold tracking-tight">Access Denied</h1>
      <p className="mt-2 text-slate-400 max-w-md">
        You do not have the required role permissions to view this module. Please contact your system administrator.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold hover:bg-brand-500 transition-colors"
      >
        Return to Dashboard
      </Link>
    </div>
  );
};
export default Unauthorized;
