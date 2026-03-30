import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PrivateRoute } from './guards';

const Clients = lazy(() => import('@/pages/Clients'));

export const clientRoutes: RouteObject[] = [
  {
    path: '/clients',
    element: <PrivateRoute><Clients /></PrivateRoute>,
  },
];
