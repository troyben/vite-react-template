import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { AdminOnlyRoute, PrivateRoute } from './guards';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Users = lazy(() => import('@/pages/Users'));
const Settings = lazy(() => import('@/pages/Settings'));
const SystemSettings = lazy(() => import('@/pages/SystemSettings'));

export const adminRoutes: RouteObject[] = [
  {
    path: '/dashboard',
    element: <AdminOnlyRoute><Dashboard /></AdminOnlyRoute>,
  },
  {
    path: '/users',
    element: <AdminOnlyRoute><Users /></AdminOnlyRoute>,
  },
  {
    path: '/settings',
    element: <PrivateRoute><Settings /></PrivateRoute>,
  },
  {
    path: '/system-settings',
    element: <AdminOnlyRoute><SystemSettings /></AdminOnlyRoute>,
  },
];
