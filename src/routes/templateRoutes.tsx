import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PrivateRoute } from './guards';

const CanvasEditor = lazy(() => import('@/pages/CanvasEditor'));

export const templateRoutes: RouteObject[] = [
  {
    path: '/canvas',
    element: <PrivateRoute><CanvasEditor /></PrivateRoute>,
  },
];
