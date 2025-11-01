#!/usr/bin/env node
/**
 * Generate static SEO files (sitemap.xml, robots.txt) from site config
 * This script should be run before building to ensure static files are up-to-date
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read site config
const configPath = join(rootDir, 'src/config/site.ts');
const configContent = readFileSync(configPath, 'utf-8');

// Extract URL from config (simple regex extraction)
const urlMatch = configContent.match(/url:\s*['"]([^'"]+)['"]/);
if (!urlMatch) {
  console.error('❌ Could not extract URL from site config');
  process.exit(1);
}
const siteUrl = urlMatch[1];

console.log(`📝 Generating static SEO files with site URL: ${siteUrl}`);

// Generate sitemap.xml
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="ru" href="${siteUrl}/" />
    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/" />
    <xhtml:link rel="alternate" hreflang="be" href="${siteUrl}/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/" />
  </url>
  <url>
    <loc>${siteUrl}/app</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="ru" href="${siteUrl}/app" />
    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/app" />
    <xhtml:link rel="alternate" hreflang="be" href="${siteUrl}/app" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}/app" />
  </url>
</urlset>
`;

// Generate robots.txt
const robots = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${siteUrl}/sitemap.xml

# Disallow admin/internal paths if any
Disallow: /api/
`;

// Write files
writeFileSync(join(rootDir, 'public/sitemap.xml'), sitemap);
writeFileSync(join(rootDir, 'public/robots.txt'), robots);

console.log('✅ Generated public/sitemap.xml');
console.log('✅ Generated public/robots.txt');
console.log('✨ Done!');

