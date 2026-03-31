import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { AdminOnlyRoute } from './guards';

const Materials = lazy(() => import('@/pages/Materials'));

export const materialRoutes: RouteObject[] = [
  {
    path: '/materials',
    element: <AdminOnlyRoute><Materials /></AdminOnlyRoute>,
  },
];
