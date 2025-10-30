import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import '../styles/tailwind.css';
import { router } from './router';
import { I18nProvider } from '../i18n/context';

const container = document.getElementById('root')!;
createRoot(container).render(
  <React.StrictMode>
    <I18nProvider>
      <RouterProvider router={router} />
    </I18nProvider>
  </React.StrictMode>
);

