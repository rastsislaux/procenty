import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { DashboardPage } from '../loan-ui/pages/DashboardPage';
import { HomePage } from '../loan-ui/pages/HomePage';
import { ErrorPage, NotFoundPage } from '../shared/components/ErrorBoundary';

function LayoutShell() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LayoutShell />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'app', element: <DashboardPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

