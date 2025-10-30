import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/context';

export function HomePage() {
  const { t } = useI18n();
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
      <div className="mx-auto max-w-6xl px-4 py-16">
        {/* Hero */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{t.landing.title}</h1>
          <p className="mx-auto max-w-3xl text-gray-600 text-lg">{t.landing.subtitle}</p>
          <div>
            <Link
              to="/app"
              className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-3 text-white shadow hover:bg-blue-700"
            >
              {t.landing.cta}
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16">
          <h2 className="text-center text-xl font-semibold text-gray-800">{t.landing.featuresTitle}</h2>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <div className="mt-12 mx-auto max-w-4xl text-left">
          <div className="text-sm font-semibold text-gray-800">{t.landing.disclaimerTitle}</div>
          <div className="mt-2 text-xs text-gray-700 leading-relaxed">
            {t.landing.disclaimerText}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="text-3xl">{emoji}</div>
      <div className="mt-3 text-lg font-medium">{title}</div>
      <div className="mt-1 text-sm text-gray-600">{desc}</div>
    </div>
  );
}

