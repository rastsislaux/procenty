import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { YandexAd } from '../../loan-ui/components/YandexAd';
import { useI18n } from '../../i18n/context';
import { LanguageSelector } from '../../i18n/LanguageSelector';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const { pathname } = useLocation();
  const showAds = pathname !== '/';
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
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="full-width mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold">{t.header.title}</Link>
          <div className="flex items-center gap-3">
            <a
              href="https://forms.gle/piPyucb3iox7FdgZA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              {t.header.contact}
            </a>
            <LanguageSelector />
          </div>
        </div>
      </header>
      <main className="flex-1 bg-gray-50">
        <div className="full-width px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Main content */}
            <div className={showAds ? 'lg:col-span-11' : 'lg:col-span-12'}>
              <RouteFade key={pathname}>
                {children}
              </RouteFade>
            </div>
            
            {/* Right sidebar ad - hidden on mobile/tablet and landing */}
            {showAds && (
              <aside className="hidden lg:block lg:col-span-1">
                <div className="sticky top-6">
                  <YandexAd blockId="R-A-17605551-1" id="yandex_rtb_R-A-17605551-2" />
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>
      <footer className="border-t bg-white">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 text-xs text-gray-500 space-y-2">
          <div>
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

