/**
 * Currency conversion utilities
 * Uses free exchange rate API (exchangerate-api.com) to fetch real-time rates.
 * Falls back to cached/default rates if API is unavailable.
 * 
 * Currency codes use ISO 4217 format (e.g., "USD", "EUR", "BYN", "GBP")
 * These match the currency.code from the loan engine's Currency interface.
 */

// Default/fallback exchange rates: value of 1 unit of currency in USD
// These are used as fallback if API is unavailable
const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08, // 1 EUR = 1.08 USD (approx)
  BYN: 0.31, // 1 BYN = 0.31 USD (approx, 1 USD ≈ 3.23 BYN)
  GBP: 1.27, // 1 GBP = 1.27 USD (approx)
};

// Cached exchange rates and metadata
let cachedRates: Record<string, number> = { ...DEFAULT_EXCHANGE_RATES };
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch exchange rates from API
 * Uses exchangerate-api.com V6 open access endpoint (no API key required)
 * Documentation: https://www.exchangerate-api.com/docs/free
 */
async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    // Using exchangerate-api.com V6 open access endpoint (no API key needed)
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    
    // Check if response was successful
    if (data.result !== 'success') {
      throw new Error(`API returned error: ${data['error-type'] || 'unknown error'}`);
    }
    
    // Convert from { rates: { EUR: 0.919, ... } } format to our format
    // API returns rates as "1 USD = X CURRENCY", so we need to invert for our use case
    // API returns base_code=USD, so rates['EUR'] = how many EUR per 1 USD
    // We want: how many USD per 1 EUR = 1 / rates['EUR']
    const rates: Record<string, number> = { USD: 1.0 };
    if (data.rates) {
      for (const [currency, rate] of Object.entries(data.rates)) {
        // rate is "how many units of currency per 1 USD"
        // We want "how many USD per 1 unit of currency" = 1 / rate
        rates[currency] = 1 / (rate as number);
      }
    }
    return rates;
  } catch (error) {
    console.warn('Failed to fetch exchange rates from API, using fallback rates:', error);
    return DEFAULT_EXCHANGE_RATES;
  }
}

/**
 * Get exchange rates, using cache if available and fresh
 */
export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  
  // Return cached rates if they're still fresh
  if (cachedRates && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedRates;
  }
  
  // Fetch new rates and update cache
  const rates = await fetchExchangeRates();
  cachedRates = rates;
  cacheTimestamp = now;
  
  return rates;
}

/**
 * Get exchange rate for a specific currency (in USD per 1 unit of currency)
 * This is async to support API fetching, but will use cache when possible
 */
export async function getExchangeRate(currency: string): Promise<number> {
  const rates = await getExchangeRates();
  return rates[currency] ?? DEFAULT_EXCHANGE_RATES[currency] ?? 1.0;
}

/**
 * Initialize exchange rates (fetch on app load)
 * Call this once when the app starts to warm up the cache
 */
export function initExchangeRates(): void {
  getExchangeRates().catch(err => {
    console.warn('Failed to initialize exchange rates:', err);
  });
}

/**
 * Convert amount from source currency to target currency (async version)
 * EXCHANGE_RATES[currency] = value of 1 unit of that currency in USD
 * So 1 EUR = 1.08 USD means EXCHANGE_RATES['EUR'] = 1.08
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  const rates = await getExchangeRates();
  const fromRate = rates[fromCurrency] ?? DEFAULT_EXCHANGE_RATES[fromCurrency] ?? 1.0;
  const toRate = rates[toCurrency] ?? DEFAULT_EXCHANGE_RATES[toCurrency] ?? 1.0;
  
  // Convert to USD first (multiply by exchange rate)
  // If fromCurrency is EUR and amount is 100 EUR:
  // 100 EUR * 1.08 = 108 USD
  const usdAmount = amount * fromRate;
  
  // Convert from USD to target currency (divide by target exchange rate)
  // If toCurrency is EUR: 108 USD / 1.08 = 100 EUR
  return usdAmount / toRate;
}

/**
 * Synchronous version using cached rates (may use stale data)
 * Use this for immediate conversions when you can't await
 */
export function convertCurrencySync(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = cachedRates[fromCurrency] ?? DEFAULT_EXCHANGE_RATES[fromCurrency] ?? 1.0;
  const toRate = cachedRates[toCurrency] ?? DEFAULT_EXCHANGE_RATES[toCurrency] ?? 1.0;
  
  const usdAmount = amount * fromRate;
  return usdAmount / toRate;
}

/**
 * Convert a formatted currency string (e.g., "10,000.50") to number, convert, and format back
 * Uses synchronous version for immediate conversion (may use cached/stale rates)
 */
export function convertCurrencyString(
  amountStr: string | undefined | null,
  fromCurrency: string,
  toCurrency: string
): string {
  if (!amountStr) return amountStr || '';
  
  const numAmount = parseFloat(String(amountStr).replace(/,/g, ''));
  if (isNaN(numAmount)) return amountStr;
  
  const converted = convertCurrencySync(numAmount, fromCurrency, toCurrency);
  
  // Format with 2 decimal places and thousand separators
  return converted.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Get all available currencies from cache
 * Returns common currencies by default
 */
export function getAvailableCurrencies(): string[] {
  // Return currencies we know about (from loan engine and common ones)
  return ['USD', 'EUR', 'BYN', 'GBP'];
}

/**
 * Get current cached exchange rates synchronously
 * Returns rates in format: { currency: USD_per_1_unit }
 */
export function getCachedExchangeRates(): Record<string, number> {
  return { ...cachedRates };
}

