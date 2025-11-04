import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { LanguageSelector } from '../../i18n/LanguageSelector';

function RouteFade({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setVisible(true), 0);
    return () => clearTimeout(id);
  }, []);
  return (
    <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
      {children}
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white shadow-soft">
        <div className="w-full max-w-screen-2xl mx-auto px-2 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link 
            to="/" 
            onClick={() => {
              // Mark that user intentionally navigated to home page
              try {
                sessionStorage.setItem('procenty.intentionalHomeNav', 'true');
              } catch (e) {
                // Ignore if sessionStorage is not available
              }
            }}
            className="text-base sm:text-xl font-bold text-primary-700 hover:text-primary-800 transition-colors"
          >
            {t.header.title}
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="https://forms.gle/piPyucb3iox7FdgZA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-neutral-300 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white shadow-soft hover:bg-neutral-50 hover:shadow-medium transition-all duration-200"
            >
              {t.header.contact}
            </a>
            <LanguageSelector />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-gradient-to-b from-neutral-50 to-neutral-100 relative">
        <div className="w-full px-2 sm:px-4 py-4 sm:py-8">
          <RouteFade key={pathname}>
            {children}
          </RouteFade>
        </div>
      </main>
      <footer className="border-t border-neutral-200 bg-white shadow-soft">
        <div className="w-full lg:max-w-screen-2xl lg:mx-auto px-2 sm:px-4 py-4 text-xs text-neutral-600 space-y-2">
          <div className="font-medium">
            {t.footer.rights
              .replace('{from}', '2025')
              .replace('{to}', String(new Date().getFullYear()))}
          </div>
          <div className="leading-relaxed">
            {t.landing.disclaimerText}
          </div>
        </div>
      </footer>
    </div>
  );
}

