import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

import { Login } from './pages/Login';
import { Unauthorized } from './pages/Unauthorized';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetails } from './pages/CustomerDetails';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { Challans } from './pages/Challans';
import { CreateChallan } from './pages/CreateChallan';
import { ChallanDetails } from './pages/ChallanDetails';
import { Invoices } from './pages/Invoices';
import { Users } from './pages/Users';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes inside Layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route
                index
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Customers CRM */}
              <Route
                path="customers"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="customers/:id"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
                    <CustomerDetails />
                  </ProtectedRoute>
                }
              />

              {/* Products */}
              <Route
                path="products"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}>
                    <Products />
                  </ProtectedRoute>
                }
              />

              {/* Stock Ledger */}
              <Route
                path="inventory"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']}>
                    <Inventory />
                  </ProtectedRoute>
                }
              />

              {/* Sales Challans */}
              <Route
                path="challans"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}>
                    <Challans />
                  </ProtectedRoute>
                }
              />
              <Route
                path="challans/new"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
                    <CreateChallan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="challans/:id"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']}>
                    <ChallanDetails />
                  </ProtectedRoute>
                }
              />

              {/* Invoices */}
              <Route
                path="invoices"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTS']}>
                    <Invoices />
                  </ProtectedRoute>
                }
              />

              {/* User management */}
              <Route
                path="users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <Users />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
export default App;
