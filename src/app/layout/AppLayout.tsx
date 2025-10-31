import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { YandexAd } from '../../loan-ui/components/YandexAd';
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
  const showAds = pathname !== '/';
  const [adHasError, setAdHasError] = React.useState(false);

  // Reset error state when route changes to allow retry
  React.useEffect(() => {
    setAdHasError(false);
  }, [pathname]);
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white shadow-soft">
        <div className="full-width mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-primary-700 hover:text-primary-800 transition-colors">{t.header.title}</Link>
          <div className="flex items-center gap-3">
            <a
              href="https://forms.gle/piPyucb3iox7FdgZA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 bg-white shadow-soft hover:bg-neutral-50 hover:shadow-medium transition-all duration-200"
            >
              {t.header.contact}
            </a>
            <LanguageSelector />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-gradient-to-b from-neutral-50 to-neutral-100">
        <div className="full-width px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {showAds && (
              <aside 
                className={`lg:col-span-2 ${adHasError ? 'hidden' : 'hidden lg:block'}`}
                style={{ display: adHasError ? 'none' : undefined }}
              >
                <div className="sticky top-8">
                  <YandexAd 
                    blockId="R-A-17605551-1" 
                    id="yandex_rtb_R-A-17605551-2"
                    onError={setAdHasError}
                  />
                </div>
              </aside>
            )}

            {/* Main content - use style to handle width change without remounting */}
            <div 
              className="lg:col-span-12 flex flex-col min-h-0"
              style={{
                gridColumn: showAds && !adHasError ? 'span 10 / span 10' : 'span 12 / span 12'
              }}
            >
              <RouteFade key={pathname}>
                {children}
              </RouteFade>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-neutral-200 bg-white shadow-soft">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 text-xs text-neutral-600 space-y-2">
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

