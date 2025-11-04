#!/usr/bin/env node

/**
 * Script to download Belarusbank Open Banking API data
 * Usage: npm run download-belarusbank-data
 * 
 * The API returns paginated data with structure:
 * {
 *   "data": {
 *     "bank": {
 *       "services": {
 *         "service": [...]
 *       }
 *     }
 *   },
 *   "links": {...},
 *   "meta": {...}
 * }
 */

import { writeFileSync, appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE_URL = 'https://belarusbank.by/open-banking/v1.0/banks/AKBBBY2X/loan';
const OUTPUT_FILE = join(__dirname, '..', 'public', 'data', 'belarusbank-open-banking-loans.json');

function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
          return;
        }

        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function fetchAllPages() {
  const allServices = [];
  let nextUrl = API_BASE_URL;
  let pageNum = 1;

  while (nextUrl) {
    console.log(`📄 Fetching page ${pageNum}...`);
    
    const response = await fetchData(nextUrl);
    
    // Extract services from nested structure
    if (!response.data?.bank?.services?.service) {
      throw new Error('Invalid API response structure: missing data.bank.services.service');
    }

    const services = Array.isArray(response.data.bank.services.service)
      ? response.data.bank.services.service
      : [response.data.bank.services.service];

    allServices.push(...services);
    console.log(`   Found ${services.length} services (total: ${allServices.length})`);

    // Check for next page
    if (response.links?.next) {
      // Extract the path from the next link and build full URL
      const nextPath = response.links.next.startsWith('/')
        ? response.links.next
        : `/${response.links.next}`;
      nextUrl = `https://belarusbank.by/open-banking/v1.0${nextPath}`;
      pageNum++;
    } else {
      nextUrl = null;
    }

    // Safety limit to prevent infinite loops
    if (pageNum > 100) {
      console.warn('⚠️  Reached 100 pages limit, stopping');
      break;
    }
  }

  return allServices;
}

async function main() {
  try {
    console.log('🔄 Fetching data from Belarusbank Open Banking API...');
    console.log(`   Base URL: ${API_BASE_URL}`);

    const services = await fetchAllPages();

    if (services.length === 0) {
      throw new Error('No services found in API response');
    }

    console.log(`✅ Successfully fetched and validated data: ${services.length} services`);

    // Write to file as array
    writeFileSync(OUTPUT_FILE, JSON.stringify(services, null, 2), 'utf-8');
    console.log(`✅ Data saved to: ${OUTPUT_FILE}`);

    // Output count for GitHub Actions
    if (process.env.GITHUB_OUTPUT) {
      const outputFile = process.env.GITHUB_OUTPUT;
      appendFileSync(outputFile, `items_count=${services.length}\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

