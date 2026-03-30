import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PrivateRoute } from './guards';

const QuotationList = lazy(() => import('@/pages/QuotationList'));
const QuotationForm = lazy(() => import('@/pages/QuotationForm'));
const QuotationDetail = lazy(() => import('@/pages/QuotationDetail'));

export const quotationRoutes: RouteObject[] = [
  {
    path: '/quotations',
    element: <PrivateRoute><QuotationList /></PrivateRoute>,
  },
  {
    path: '/quotations/new',
    element: <PrivateRoute><QuotationForm /></PrivateRoute>,
  },
  {
    path: '/quotations/edit/:id',
    element: <PrivateRoute><QuotationForm /></PrivateRoute>,
  },
  {
    path: '/quotations/:id',
    element: <PrivateRoute><QuotationDetail /></PrivateRoute>,
  },
];
