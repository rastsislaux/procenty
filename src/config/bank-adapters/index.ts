export * from './types';
export * from './belarusbank-adapter';

/**
 * Registry of available bank adapters
 */
import { BankApiAdapter } from './types';
import { BelarusbankAdapter } from './belarusbank-adapter';

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
  // Register Belarusbank adapter
  const belarusbankAdapter = new BelarusbankAdapter();
  registerAdapter(belarusbankAdapter);
}

