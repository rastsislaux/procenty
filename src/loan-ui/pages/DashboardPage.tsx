import React, { useState, useEffect } from 'react';
import { TemplatesPage } from './TemplatesPage';
import { ComparePage } from './ComparePage';
import { YandexAd } from '../../shared/components/YandexAd';
import { SEO } from '../../shared/components/SEO';
import { useI18n } from '../../i18n/context';

export function DashboardPage() {
  const { t } = useI18n();
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [adHasError, setAdHasError] = useState(false);

  // Reset error state when component mounts
  useEffect(() => {
    setAdHasError(false);
  }, []);

  return (
    <>
      <SEO 
        title={t.seo.appTitle}
        description={t.seo.appDescription}
        keywords={t.seo.appKeywords}
      />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Yandex Ad sidebar */}
      {!adHasError && (
        <aside className="lg:col-span-2 hidden lg:block">
          <div className="sticky top-8">
            <YandexAd 
              blockId="R-A-17605551-1" 
              id="yandex_rtb_R-A-17605551-2"
              onError={setAdHasError}
            />
          </div>
        </aside>
      )}
      
      {/* Main content */}
      <div 
        className="lg:col-span-12 flex flex-col min-h-0"
        style={{
          gridColumn: !adHasError ? 'span 10 / span 10' : 'span 12 / span 12'
        }}
      >
        <div className="flex flex-col lg:flex-row gap-4 h-full">
          <main className="lg:w-[75%] w-full">
            <ComparePage selectedTemplateIds={selectedForComparison} />
          </main>
          <aside className="lg:w-[25%] w-full flex flex-col min-h-0">
            <TemplatesPage 
              selectedForComparison={selectedForComparison}
              onSelectionChange={setSelectedForComparison}
            />
          </aside>
        </div>
      </div>
    </div>
    </>
  );
}

