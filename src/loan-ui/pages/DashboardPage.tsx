import React, { useState, useEffect } from 'react';
import { TemplatesPage } from './TemplatesPage';
import { ComparePage } from './ComparePage';
import { YandexAd } from '../../shared/components/YandexAd';
import { SEO } from '../../shared/components/SEO';
import { useI18n } from '../../i18n/context';
import { loadAppState, saveAppState } from '../state/appStateStore';
import { MobileDrawer } from '../../shared/components/MobileDrawer';
import { Button } from '../../shared/components/Button';

export function DashboardPage() {
  const { t } = useI18n();
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>(() => {
    // Load initial state from localStorage
    return loadAppState().selectedTemplateIds;
  });
  const [adHasError, setAdHasError] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Reset error state when component mounts
  useEffect(() => {
    setAdHasError(false);
  }, []);

  // Save selected templates to localStorage whenever they change
  useEffect(() => {
    const currentState = loadAppState();
    saveAppState({
      ...currentState,
      selectedTemplateIds: selectedForComparison,
    });
  }, [selectedForComparison]);

  return (
    <>
      <SEO 
        title={t.seo.appTitle}
        description={t.seo.appDescription}
        keywords={t.seo.appKeywords}
      />
    <div className="w-full lg:grid lg:grid-cols-12 lg:gap-6 h-full">
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
        className="w-full lg:col-span-12 flex flex-col min-h-0"
        style={{
          gridColumn: !adHasError ? 'span 10 / span 10' : 'span 12 / span 12'
        }}
      >
        <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 h-full">
          <main className="w-full lg:w-[75%]">
            {/* Mobile button to open templates drawer */}
            <div className="lg:hidden mb-3">
              <Button
                variant="primary-outline"
                size="sm"
                onClick={() => setMobileDrawerOpen(true)}
                className="w-full"
              >
                {t.templates.title || 'Templates'} ({selectedForComparison.length})
              </Button>
            </div>
            <ComparePage selectedTemplateIds={selectedForComparison} />
          </main>
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-full lg:w-[25%] flex flex-col min-h-0">
            <TemplatesPage 
              selectedForComparison={selectedForComparison}
              onSelectionChange={setSelectedForComparison}
            />
          </aside>
        </div>
        
        {/* Mobile drawer for templates */}
        <MobileDrawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          title={t.templates.title || 'Templates'}
        >
          <TemplatesPage 
            selectedForComparison={selectedForComparison}
            onSelectionChange={(ids) => {
              setSelectedForComparison(ids);
            }}
          />
        </MobileDrawer>
      </div>
    </div>
    </>
  );
}

