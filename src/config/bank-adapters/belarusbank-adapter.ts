import { BankApiAdapter, BankAdapterConfig, FetchTemplatesOptions, FetchTemplatesResult, BankApiResponse } from './types';
import { Template } from '../loan-templates';

/**
 * Belarusbank API response structure
 * Based on: https://belarusbank.by/be/33139/forDevelopers/api/kredits
 */
interface BelarusbankApiItem {
  inf_id: string | number;
  kredit_type: string;
  group_name: string;
  val_key: string;
  usl_name: string;
  inf_time: string | number;
  inf_proc_formula: string;
  platName: string;
  inf_koe?: string | number;
  inf_odolg?: string | number;
  inf_oproc?: string | number;
  inf_max_size?: string | number;
}

type BelarusbankApiResponse = BelarusbankApiItem[];

/**
 * Belarusbank API adapter
 * Implements dynamic loading of loan templates from Belarusbank API
 */
export class BelarusbankAdapter implements BankApiAdapter {
  readonly bankId = 'belarusbank';
  readonly bankName = 'Беларусбанк';
  
  private readonly config: BankAdapterConfig;
  private cache: { data: Template[]; timestamp: number } | null = null;
  private readonly defaultCacheTtl = 60 * 60 * 1000; // 1 hour

  constructor(config?: Partial<BankAdapterConfig>) {
    this.config = {
      bankId: 'belarusbank',
      bankName: 'Беларусбанк',
      apiBaseUrl: 'https://belarusbank.by/api',
      cacheTtl: this.defaultCacheTtl,
      ...config,
    };
  }

  async fetchTemplates(options: FetchTemplatesOptions = {}): Promise<FetchTemplatesResult> {
    const { types, forceRefresh = false } = options;
    const errors: string[] = [];

    // Check cache first
    if (!forceRefresh && this.cache && Date.now() - this.cache.timestamp < (this.config.cacheTtl || this.defaultCacheTtl)) {
      return {
        templates: this.cache.data,
        errors: [],
        fetchedAt: this.cache.timestamp,
      };
    }

    try {
      // Try to fetch from local static file first (updated by GitHub Actions)
      // Fallback to direct API call if file doesn't exist
      let rawResponse: BelarusbankApiResponse;

      try {
        // Load from static file (no CORS issues)
        const fileResponse = await fetch('/data/belarusbank-loans.json');
        if (fileResponse.ok) {
          rawResponse = await fileResponse.json();
          
          // Filter by types if specified
          if (types && types.length > 0) {
            const typeMap: Record<string, string> = {
              'потребительский': 'потребительский',
              'автокредитование': 'автокредитование',
              'на образование': 'на образование',
              'на недвижимость': 'на недвижимость',
            };
            rawResponse = rawResponse.filter((item: BelarusbankApiItem) => 
              types.some(type => item.kredit_type === typeMap[type] || item.kredit_type === type)
            );
          }
        } else {
          throw new Error('Static file not found, falling back to API');
        }
      } catch (fileError) {
        // Fallback to direct API call (may fail due to CORS)
        console.warn('Failed to load from static file, trying direct API:', fileError);
        
        // Build API URL
        const url = new URL(`${this.config.apiBaseUrl}/kredits_info`);
        if (types && types.length > 0) {
          url.searchParams.set('type', types.join(','));
        }

        // Fetch from API
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        rawResponse = await response.json();
      }
      
      // Validate response
      if (!this.validateResponse(rawResponse)) {
        throw new Error('Invalid API response format');
      }

      // Map to templates
      const templates = this.mapToTemplates(rawResponse);

      // Update cache
      this.cache = {
        data: templates,
        timestamp: Date.now(),
      };

      return {
        templates,
        errors,
        fetchedAt: this.cache.timestamp,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
      
      // Return cached data if available, even if stale
      if (this.cache) {
        return {
          templates: this.cache.data,
          errors,
          fetchedAt: this.cache.timestamp,
        };
      }

      return {
        templates: [],
        errors,
        fetchedAt: Date.now(),
      };
    }
  }

  validateResponse(rawResponse: BankApiResponse): boolean {
    if (!Array.isArray(rawResponse)) {
      return false;
    }

    // Basic validation - check if items have required fields
    return rawResponse.every((item: any) => {
      return (
        item &&
        typeof item === 'object' &&
        'inf_id' in item &&
        'kredit_type' in item &&
        'group_name' in item &&
        'val_key' in item &&
        'inf_proc_formula' in item
      );
    });
  }

  mapToTemplates(rawResponse: BankApiResponse): Template[] {
    const items = rawResponse as BelarusbankApiItem[];
    
    return items.map((item) => {
      // Parse interest rate from formula (e.g., "17.0%" -> 17.0)
      const rateMatch = item.inf_proc_formula.match(/(\d+\.?\d*)/);
      const rate = rateMatch ? parseFloat(rateMatch[1]) : undefined;

      // Parse term in months
      const termMonths = this.parseTerm(item.inf_time);

      // Map currency
      const currencyMap: Record<string, 'USD' | 'EUR' | 'BYN' | 'GBP'> = {
        'BYN': 'BYN',
        'USD': 'USD',
        'EUR': 'EUR',
        'GBP': 'GBP',
        'RUB': 'BYN', // Default RUB to BYN
      };
      const currency = currencyMap[item.val_key?.toUpperCase() || 'BYN'] || 'BYN';

      // Parse grace period
      const graceMonths = item.inf_odolg ? parseInt(String(item.inf_odolg), 10) : undefined;
      const graceInterestMonths = item.inf_oproc ? parseInt(String(item.inf_oproc), 10) : undefined;
      
      // Determine if grace period exists and type
      const hasGrace = (graceMonths && graceMonths > 0) || (graceInterestMonths && graceInterestMonths > 0);
      const grace = hasGrace && graceMonths ? {
        type: 'InterestOnly' as const,
        months: graceMonths,
      } : undefined;

      // Build template ID
      const templateId = `belarusbank-api-${item.inf_id}`;

      // Build constraints
      const constraints: Template['constraints'] = {};
      
      if (termMonths) {
        // If term is fixed, set it as enum; otherwise allow range
        constraints.termMonths = { type: 'enum', values: [termMonths] };
      }

      if (rate != null) {
        constraints.nominalAnnualRatePercent = { type: 'range', min: rate, max: rate, step: 0.01 };
      }

      if (item.inf_max_size && Number(item.inf_max_size) > 0) {
        constraints.principal = { type: 'range', max: Number(item.inf_max_size), min: 1000, step: 1 };
      } else {
        constraints.principal = { type: 'range', min: 1000, step: 1 };
      }

      const template: Template = {
        id: templateId,
        name: item.group_name || item.kredit_type,
        nameI18n: {
          ru: item.group_name || item.kredit_type,
          be: item.group_name || item.kredit_type,
        },
        description: item.usl_name || `${item.kredit_type} кредит`,
        descriptionI18n: {
          ru: item.usl_name || `${item.kredit_type} кредит`,
          be: item.usl_name || `${item.kredit_type} крэдыт`,
        },
        currency,
        nominalAnnualRatePercent: rate,
        termMonths: termMonths || undefined,
        amortization: 'Differentiated', // Default for Belarusbank loans
        dayCount: 'Actual_365',
        prepaymentPolicy: 'ReduceTerm',
        prepaymentsAllowed: true,
        allowFirstPayment: true,
        bankUrl: 'https://belarusbank.by',
        grace,
        constraints,
      };

      return template;
    });
  }

  /**
   * Parse term from API response
   * Can be number (months) or string (e.g., "120 месяцев")
   */
  private parseTerm(term: string | number | undefined): number | undefined {
    if (!term) return undefined;
    
    if (typeof term === 'number') {
      return term;
    }

    // Try to extract number from string
    const match = String(term).match(/(\d+)/);
    return match ? parseInt(match[1], 10) : undefined;
  }
}

