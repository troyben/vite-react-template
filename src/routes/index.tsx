import { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authRoutes } from './authRoutes';
import { quotationRoutes } from './quotationRoutes';
import { templateRoutes } from './templateRoutes';
import { adminRoutes } from './adminRoutes';
import { clientRoutes } from './clientRoutes';
import Unauthorized from '@/pages/Unauthorized';
import { AdminOnlyRoute } from './guards';

const allRoutes = [
  ...authRoutes,
  ...quotationRoutes,
  ...templateRoutes,
  ...adminRoutes,
  ...clientRoutes,
];

export default function AppRoutes() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Home route — admin goes to dashboard, users to quotations */}
        <Route
          path="/"
          element={
            user?.role === 'admin'
              ? <AdminOnlyRoute><Navigate to="/dashboard" replace /></AdminOnlyRoute>
              : <Navigate to="/quotations" replace />
          }
        />

        {/* All feature routes */}
        {allRoutes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}

        {/* Public routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Catch-all */}
        <Route
          path="*"
          element={
            <Navigate
              to={user ? (user.role === 'admin' ? '/' : '/quotations') : '/login'}
              replace
            />
          }
        />
      </Routes>
    </Suspense>
  );
}
