import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useI18n } from '../../i18n/context';
import { SITE_CONFIG } from '../../config/site';

type SEOProps = {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  noindex?: boolean;
  canonical?: string;
};

export function SEO({ 
  title, 
  description, 
  keywords,
  ogImage,
  noindex = false,
  canonical
}: SEOProps) {
  const { language } = useI18n();
  const location = useLocation();
  
  // Use current origin in browser, otherwise fallback to configured site URL
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}` 
    : SITE_CONFIG.url;
  
  const currentPath = location.pathname;
  // Remove trailing slash except for root
  const normalizedPath = currentPath === '/' ? '/' : currentPath.replace(/\/$/, '');
  const fullUrl = `${baseUrl}${normalizedPath}`;
  const canonicalUrl = canonical || fullUrl;
  
  // Default image if not provided
  const defaultOgImage = `${baseUrl}/og-image.png`;
  const ogImageUrl = ogImage || defaultOgImage;

  // Language alternates - for now all languages point to same URL since language is handled via state
  const langAlternates = [
    { hreflang: 'ru', href: `${baseUrl}${normalizedPath}` },
    { hreflang: 'en', href: `${baseUrl}${normalizedPath}` },
    { hreflang: 'be', href: `${baseUrl}${normalizedPath}` },
    { hreflang: 'x-default', href: `${baseUrl}${normalizedPath}` },
  ];

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Language Alternates */}
      {langAlternates.map(({ hreflang, href }) => (
        <link key={hreflang} rel="alternate" hrefLang={hreflang} href={href} />
      ))}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={fullUrl} />
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={ogImageUrl} />
      <meta property="og:locale" content={language === 'ru' ? 'ru_RU' : language === 'be' ? 'be_BY' : 'en_US'} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImageUrl} />
      
      {/* Additional SEO */}
      <meta name="author" content={SITE_CONFIG.author} />
      <meta name="geo.region" content="BY" />
      <meta name="geo.placename" content="Belarus" />
    </Helmet>
  );
}

