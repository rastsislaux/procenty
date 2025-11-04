import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import '../styles/tailwind.css';
import { router } from './router';
import { I18nProvider } from '../i18n/context';
import { ErrorBoundary } from '../shared/components/ErrorBoundary';
import { initExchangeRates } from '../shared/utils/currencyConverter';
import { initDebug } from '../shared/utils/debug';

// Initialize exchange rates on app startup
initExchangeRates();

// Initialize debug API (available via window.Debug)
initDebug();

const container = document.getElementById('root')!;
createRoot(container).render(
  <React.StrictMode>
    <HelmetProvider>
      <I18nProvider>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </I18nProvider>
    </HelmetProvider>
  </React.StrictMode>
);

