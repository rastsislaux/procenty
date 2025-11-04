import React, { useEffect, useRef } from 'react';
import { createBrowserRouter, Outlet, Navigate, useLocation } from 'react-router-dom';
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

function HomePageOrRedirect() {
  const location = useLocation();
  const hasCheckedRef = useRef(false);
  const [shouldRedirect, setShouldRedirect] = React.useState(false);
  
  useEffect(() => {
    // Only check on initial mount, not on subsequent navigations
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    
    // Check if user intentionally navigated to home page (e.g., clicked logo)
    try {
      const intentionalNav = sessionStorage.getItem('procenty.intentionalHomeNav') === 'true';
      if (intentionalNav) {
        // Clear the flag so it only applies once
        sessionStorage.removeItem('procenty.intentionalHomeNav');
        // User intentionally navigated here - show landing page
        return;
      }
    } catch (e) {
      // Ignore if sessionStorage is not available
    }
    
    // Check if user has visited before by checking if app state exists in localStorage
    // This means they've interacted with the app at least once
    try {
      const hasVisitedBefore = localStorage.getItem('procenty.appState.v1') !== null;
      
      // Redirect returning users to dashboard on fresh page load
      if (hasVisitedBefore) {
        setShouldRedirect(true);
      }
    } catch (error) {
      // If localStorage is not available, show landing page
      console.warn('Could not check localStorage:', error);
    }
  }, []);
  
  // Redirect returning users to dashboard
  if (shouldRedirect) {
    return <Navigate to="/app" replace />;
  }
  
  // Show landing page (for new users or when navigating from within app)
  return <HomePage />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LayoutShell />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePageOrRedirect /> },
      { path: 'app', element: <DashboardPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

