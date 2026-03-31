import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { PrivateRoute } from './guards';

const Templates = lazy(() => import('@/pages/Templates'));
const TemplateCreator = lazy(() => import('@/pages/TemplateCreator'));

export const templateRoutes: RouteObject[] = [
  {
    path: '/templates',
    element: <PrivateRoute><Templates /></PrivateRoute>,
  },
  {
    path: '/templates/create',
    element: <PrivateRoute><TemplateCreator /></PrivateRoute>,
  },
  {
    path: '/templates/:id/edit',
    element: <PrivateRoute><TemplateCreator /></PrivateRoute>,
  },
];
