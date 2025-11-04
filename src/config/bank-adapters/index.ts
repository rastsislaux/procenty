export * from './types';
export * from './belarusbank-adapter';
export * from './belarusbank-open-banking-adapter';

/**
 * Registry of available bank adapters
 */
import { BankApiAdapter } from './types';
import { BelarusbankOpenBankingAdapter } from './belarusbank-open-banking-adapter';

const adapters: Map<string, BankApiAdapter> = new Map();

/**
 * Register a bank adapter
 */
export function registerAdapter(adapter: BankApiAdapter): void {
  adapters.set(adapter.bankId, adapter);
}

/**
 * Get a bank adapter by ID
 */
export function getAdapter(bankId: string): BankApiAdapter | undefined {
  return adapters.get(bankId);
}

/**
 * Get all registered adapters
 */
export function getAllAdapters(): BankApiAdapter[] {
  return Array.from(adapters.values());
}

/**
 * Initialize default adapters
 */
export function initializeAdapters(): void {
  // Register Belarusbank Open Banking adapter (new API)
  const belarusbankAdapter = new BelarusbankOpenBankingAdapter();
  registerAdapter(belarusbankAdapter);
  
  // Old adapter disabled - keeping for reference:
  // const belarusbankAdapter = new BelarusbankAdapter();
  // registerAdapter(belarusbankAdapter);
}

