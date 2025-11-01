/**
 * Site configuration
 * 
 * This is the single source of truth for site-wide settings.
 * 
 * To change the site URL:
 * 1. Update the `url` field below
 * 2. Run `npm run generate-seo` to regenerate static files (sitemap.xml, robots.txt)
 * 3. For index.html, manually update the Open Graph URL if needed
 *    (or extend the generate-seo script to handle it automatically)
 * 
 * All React components will automatically use these values.
 */
export const SITE_CONFIG = {
  url: 'https://procenty.rastsislaux.xyz',
  name: 'Procenty',
  alternateName: 'Проценты',
  author: 'Rostislav Lipski',
  defaultLanguage: 'ru' as const,
  supportedLanguages: ['ru', 'en', 'be'] as const,
} as const;

