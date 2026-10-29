import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PrivateRoute, RoleRoute } from './guards';

const QuotationHistory = lazy(() => import('@/pages/QuotationHistory'));
const QuotationList = lazy(() => import('@/pages/QuotationList'));
const QuotationForm = lazy(() => import('@/pages/QuotationForm'));
const QuotationCosting = lazy(() => import('@/pages/QuotationCosting'));
const QuotationDetail = lazy(() => import('@/pages/QuotationDetail'));

export const quotationRoutes: RouteObject[] = [
  { path: '/quotations/:id/history', element: <RoleRoute allowedRoles={['admin', 'user']}><QuotationHistory /></RoleRoute> },
  { path: '/quotations/:id/costing', element: <RoleRoute allowedRoles={['admin', 'user']}><QuotationCosting /></RoleRoute> },
  {
    path: '/quotations',
    element: <PrivateRoute><QuotationList /></PrivateRoute>,
  },
  {
    path: '/quotations/new',
    element: <RoleRoute allowedRoles={['admin', 'user']}><QuotationForm /></RoleRoute>,
  },
  {
    path: '/quotations/edit/:id',
    element: <RoleRoute allowedRoles={['admin', 'user']}><QuotationForm /></RoleRoute>,
  },
  {
    path: '/quotations/:id',
    element: <PrivateRoute><QuotationDetail /></PrivateRoute>,
  },
];
