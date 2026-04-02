import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { RoleRoute } from './guards';

const Templates = lazy(() => import('@/pages/Templates'));
const TemplateCreator = lazy(() => import('@/pages/TemplateCreator'));

export const templateRoutes: RouteObject[] = [
  {
    path: '/templates',
    element: <RoleRoute allowedRoles={['admin', 'user']}><Templates /></RoleRoute>,
  },
  {
    path: '/templates/create',
    element: <RoleRoute allowedRoles={['admin', 'user']}><TemplateCreator /></RoleRoute>,
  },
  {
    path: '/templates/:id/edit',
    element: <RoleRoute allowedRoles={['admin', 'user']}><TemplateCreator /></RoleRoute>,
  },
];
