import { Template } from '../loan-templates';

/**
 * Raw API response from a bank API
 * Each adapter defines its own response type based on the bank's API structure
 */
export type BankApiResponse = unknown;

/**
 * Configuration for a bank API adapter
 */
export interface BankAdapterConfig {
  /** Bank identifier (e.g., 'belarusbank') */
  bankId: string;
  /** Bank display name */
  bankName: string;
  /** Base URL for the bank's API */
  apiBaseUrl: string;
  /** Optional API key if required */
  apiKey?: string;
  /** Cache TTL in milliseconds (default: 1 hour) */
  cacheTtl?: number;
}

/**
 * Options for fetching templates from a bank API
 */
export interface FetchTemplatesOptions {
  /** Filter by credit types (bank-specific) */
  types?: string[];
  /** Force refresh (bypass cache) */
  forceRefresh?: boolean;
}

/**
 * Result of fetching templates
 */
export interface FetchTemplatesResult {
  /** Successfully parsed templates */
  templates: Template[];
  /** Errors encountered during fetching/parsing */
  errors: string[];
  /** Timestamp of the fetch */
  fetchedAt: number;
}

/**
 * Interface for bank API adapters
 * Each bank needs to implement this interface to provide templates
 */
export interface BankApiAdapter {
  /** Unique identifier for this adapter */
  readonly bankId: string;
  /** Display name of the bank */
  readonly bankName: string;

  /**
   * Fetch templates from the bank's API
   * @param options Options for fetching templates
   * @returns Promise with fetched templates and any errors
   */
  fetchTemplates(options?: FetchTemplatesOptions): Promise<FetchTemplatesResult>;

  /**
   * Convert raw API response to Template format
   * @param rawResponse Raw response from bank API
   * @returns Array of Template objects
   */
  mapToTemplates(rawResponse: BankApiResponse): Template[];

  /**
   * Validate that a raw API response is valid
   * @param rawResponse Raw response to validate
   * @returns true if response is valid, false otherwise
   */
  validateResponse(rawResponse: BankApiResponse): boolean;
}

