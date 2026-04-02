import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RoleRoute } from './guards';

const Clients = lazy(() => import('@/pages/Clients'));

export const clientRoutes: RouteObject[] = [
  {
    path: '/clients',
    element: <RoleRoute allowedRoles={['admin', 'user']}><Clients /></RoleRoute>,
  },
];
