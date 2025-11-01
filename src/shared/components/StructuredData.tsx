import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SITE_CONFIG } from '../../config/site';

type StructuredDataProps = {
  data: object;
};

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(data)}
      </script>
    </Helmet>
  );
}

export function WebsiteStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: SITE_CONFIG.name,
    alternateName: SITE_CONFIG.alternateName,
    description: 'Кредитный калькулятор и инструмент для сравнения кредитов от белорусских банков',
    url: SITE_CONFIG.url,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Person',
      name: SITE_CONFIG.author,
    },
    inLanguage: SITE_CONFIG.supportedLanguages,
    featureList: [
      'Сравнение кредитов',
      'Кредитный калькулятор',
      'Расчет графика платежей',
      'Экспорт в CSV',
    ],
  };

  return <StructuredData data={data} />;
}

export function OrganizationStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: `${SITE_CONFIG.url}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: ['Russian', 'English', 'Belarusian'],
    },
    sameAs: [],
  };

  return <StructuredData data={data} />;
}

