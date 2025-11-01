import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { SEO } from '../../shared/components/SEO';
import { WebsiteStructuredData, OrganizationStructuredData } from '../../shared/components/StructuredData';

export function HomePage() {
  const { t } = useI18n();
  return (
    <>
      <SEO 
        title={t.seo.homeTitle}
        description={t.seo.homeDescription}
        keywords={t.seo.homeKeywords}
      />
      <WebsiteStructuredData />
      <OrganizationStructuredData />
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-white to-accent-50" />
      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Hero */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-neutral-900">{t.landing.title}</h1>
          <p className="mx-auto max-w-3xl text-neutral-600 text-lg">{t.landing.subtitle}</p>
          <div>
            <Link
              to="/app"
              className="inline-flex items-center rounded-lg bg-primary-600 px-6 py-3.5 text-white font-medium shadow-md hover:bg-primary-700 hover:shadow-lg transition-all duration-200"
            >
              {t.landing.cta}
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16">
          <h2 className="text-center text-2xl font-semibold text-neutral-900">{t.landing.featuresTitle}</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              emoji="📊"
              title={t.landing.featureCompareTitle}
              desc={t.landing.featureCompareDesc}
            />
            <FeatureCard
              emoji="🏦"
              title={t.landing.featureBelarusBanksTitle}
              desc={t.landing.featureBelarusBanksDesc}
            />
            <FeatureCard
              emoji="🧩"
              title={t.landing.featureTemplatesTitle}
              desc={t.landing.featureTemplatesDesc}
            />
            <FeatureCard
              emoji="⬇️"
              title={t.landing.featureExportTitle}
              desc={t.landing.featureExportDesc}
            />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-16 mx-auto max-w-4xl text-left">
          <div className="card-base p-5">
            <div className="text-sm font-semibold text-neutral-900">{t.landing.disclaimerTitle}</div>
            <div className="mt-2 text-xs text-neutral-600 leading-relaxed">
              {t.landing.disclaimerText}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

function FeatureCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="card-base p-6 hover:shadow-card-hover transition-shadow duration-200">
      <div className="text-4xl">{emoji}</div>
      <div className="mt-4 text-lg font-semibold text-neutral-900">{title}</div>
      <div className="mt-2 text-sm text-neutral-600 leading-relaxed">{desc}</div>
    </div>
  );
}

