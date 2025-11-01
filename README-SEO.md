# SEO Configuration

## Site URL Configuration

The site URL is configured in **one central location**: `src/config/site.ts`

### How to Change the Site URL

1. **Update the config file**: Edit `src/config/site.ts` and change the `url` field:
   ```typescript
   export const SITE_CONFIG = {
     url: 'https://your-new-domain.com',
     // ... other config
   };
   ```

2. **Regenerate static files**: Run the generation script:
   ```bash
   npm run generate-seo
   ```
   This will automatically update:
   - `public/sitemap.xml`
   - `public/robots.txt`

3. **Update index.html** (if needed): Manually update the Open Graph URL in `index.html`:
   ```html
   <meta property="og:url" content="https://your-new-domain.com/" />
   ```

### Automatic Updates

The static files (`sitemap.xml` and `robots.txt`) are automatically regenerated before each build via the `prebuild` script.

### Where the Config is Used

- ✅ `src/shared/components/SEO.tsx` - Meta tags, Open Graph, hreflang
- ✅ `src/shared/components/StructuredData.tsx` - JSON-LD structured data
- ✅ `public/sitemap.xml` - Generated from config
- ✅ `public/robots.txt` - Generated from config
- ⚠️ `index.html` - Static file, update manually (or extend the script)

### Files Updated Automatically

The `npm run generate-seo` script (or `npm run build`) automatically updates:
- `public/sitemap.xml` - All URLs use the configured site URL
- `public/robots.txt` - Sitemap reference uses the configured site URL

