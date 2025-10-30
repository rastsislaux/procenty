import React from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { DashboardPage } from '../loan-ui/pages/DashboardPage';
import { HomePage } from '../loan-ui/pages/HomePage';

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
    children: [
      { index: true, element: <HomePage /> },
      { path: 'app', element: <DashboardPage /> },
    ],
  },
]);

