import { BankApiAdapter, BankAdapterConfig, FetchTemplatesOptions, FetchTemplatesResult, BankApiResponse } from './types';
import { Template } from '../loan-templates';

/**
 * Belarusbank API response structure
 * Based on: https://belarusbank.by/be/33139/forDevelopers/api/kredits
 */
interface BelarusbankApiItem {
  inf_id: string | number;
  kredit_type: string;
  group_name?: string;
  group_name_ru?: string; // Alternative field name used by API
  val_key: string;
  usl_name: string;
  inf_time: string | number;
  inf_proc_formula: string | number; // Can be string or number
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
          console.log(`[BelarusbankAdapter] Loaded ${rawResponse.length} items from static file`);
          
          // Filter by types if specified
          if (types && types.length > 0) {
            const typeMap: Record<string, string> = {
              'потребительский': 'потребительский',
              'автокредитование': 'автокредитование',
              'на образование': 'на образование',
              'на недвижимость': 'на недвижимость',
            };
            const beforeFilter = rawResponse.length;
            rawResponse = rawResponse.filter((item: BelarusbankApiItem) => 
              types.some(type => item.kredit_type === typeMap[type] || item.kredit_type === type)
            );
            console.log(`[BelarusbankAdapter] Filtered to ${rawResponse.length} items (from ${beforeFilter})`);
          }
        } else {
          throw new Error(`Static file not found (HTTP ${fileResponse.status}), falling back to API`);
        }
      } catch (fileError) {
        // Fallback to direct API call (may fail due to CORS)
        console.warn('[BelarusbankAdapter] Failed to load from static file, trying direct API:', fileError);
        
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
      console.log(`[BelarusbankAdapter] Mapped ${rawResponse.length} items to ${templates.length} templates`);

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
          ('group_name' in item || 'group_name_ru' in item) &&
          'val_key' in item &&
          'inf_proc_formula' in item
        );
      });
  }

  mapToTemplates(rawResponse: BankApiResponse): Template[] {
    const items = rawResponse as BelarusbankApiItem[];
    
    // First, filter out items without group_name/group_name_ru and log warnings
    const validItems: BelarusbankApiItem[] = [];
    for (const item of items) {
      // Prioritize group_name, fallback to group_name_ru
      const groupName = item.group_name || item.group_name_ru;
      if (!groupName) {
        console.warn(`[BelarusbankAdapter] Skipping loan ${item.inf_id}: missing group_name and group_name_ru`);
        continue;
      }
      validItems.push(item);
    }
    
    // Group items by group_name (prioritize group_name over group_name_ru for grouping)
    // This ensures loans with the same group_name are grouped together
    const grouped = new Map<string, BelarusbankApiItem[]>();
    for (const item of validItems) {
      // Use group_name if available, otherwise group_name_ru
      // This groups by the actual group name, not falling back to kredit_type
      const groupKey = item.group_name || item.group_name_ru || '';
      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(item);
    }
    
    // Map grouped items to templates
    return Array.from(grouped.entries()).map(([groupKey, groupItems]) => {
      // For title, use group_name if available, otherwise group_name_ru
      // Never fallback to kredit_type - group_name is required (already validated)
      const baseItem = groupItems[0];
      const title = baseItem.group_name || baseItem.group_name_ru || groupKey;
      
      // Collect unique values from all items in the group
      const allTerms = new Set<number>();
      const allRates = new Map<number, string>(); // Map rate to usl_name (comment)
      const allMaxSizes: number[] = [];
      let hasGrace = false;
      let graceMonths: number | undefined;
      
      for (const item of groupItems) {
        // Collect terms
        // If inf_time is 0, try to parse from usl_name
        // usl_name may contain multiple terms, so we get all of them
        const terms = this.parseTerm(item.inf_time, item.usl_name);
        for (const term of terms) {
          if (term > 0) {
            allTerms.add(term);
          }
        }
        
        // Collect rates with their usl_name as comment
        let rate: number | undefined;
        if (typeof item.inf_proc_formula === 'number') {
          rate = item.inf_proc_formula;
        } else if (typeof item.inf_proc_formula === 'string') {
          const rateMatch = item.inf_proc_formula.match(/(\d+\.?\d*)/);
          rate = rateMatch ? parseFloat(rateMatch[1]) : undefined;
        }
        if (rate != null) {
          // Store rate with its usl_name (if available)
          // If multiple items have same rate but different usl_name, combine them
          const existingComment = allRates.get(rate);
          const newComment = item.usl_name || '';
          if (existingComment && newComment && existingComment !== newComment) {
            // Combine comments if different
            allRates.set(rate, `${existingComment}; ${newComment}`);
          } else if (newComment) {
            allRates.set(rate, newComment);
          } else if (!existingComment) {
            allRates.set(rate, ''); // Store even without comment to maintain the rate
          }
        }
        
        // Collect max sizes
        if (item.inf_max_size && Number(item.inf_max_size) > 0) {
          allMaxSizes.push(Number(item.inf_max_size));
        }
        
        // Check for grace period (use if any item has it)
        const itemGraceMonths = item.inf_odolg ? parseInt(String(item.inf_odolg), 10) : undefined;
        if (itemGraceMonths && itemGraceMonths > 0) {
          hasGrace = true;
          if (!graceMonths) {
            graceMonths = itemGraceMonths;
          }
        }
      }
      
      // Map currency (all items should have same currency, use base item's)
      const currencyMap: Record<string, 'USD' | 'EUR' | 'BYN' | 'GBP'> = {
        'BYN': 'BYN',
        'USD': 'USD',
        'EUR': 'EUR',
        'GBP': 'GBP',
        'RUB': 'BYN', // Default RUB to BYN
      };
      const currency = currencyMap[baseItem.val_key?.toUpperCase() || 'BYN'] || 'BYN';

      // Build template ID from group name (sanitize for ID)
      const sanitizedGroupName = groupKey.toLowerCase().replace(/[^a-z0-9а-я]+/g, '-').replace(/^-|-$/g, '');
      const templateId = `belarusbank-api-${sanitizedGroupName}-${baseItem.inf_id}`;

      // Build merged constraints from all items in group
      const constraints: Template['constraints'] = {};
      
      // Term constraint: if multiple terms, use enum; if single, use enum; if none, allow any
      if (allTerms.size > 0) {
        constraints.termMonths = { type: 'enum', values: Array.from(allTerms).sort((a, b) => a - b) };
      }

      // Rate constraint: use enum with labels (usl_name as comments)
      if (allRates.size > 0) {
        const ratesArray = Array.from(allRates.keys()).sort((a, b) => a - b);
        const rateLabels: Record<number, string> = {};
        for (const rate of ratesArray) {
          const comment = allRates.get(rate);
          if (comment) {
            rateLabels[rate] = comment;
          }
        }
        constraints.nominalAnnualRatePercent = { 
          type: 'enum', 
          values: ratesArray,
          labels: Object.keys(rateLabels).length > 0 ? rateLabels : undefined
        };
      }

      // Principal constraint: use max of all max sizes, or default min
      if (allMaxSizes.length > 0) {
        const maxSize = Math.max(...allMaxSizes);
        constraints.principal = { type: 'range', max: maxSize, min: 1000, step: 1 };
      } else {
        constraints.principal = { type: 'range', min: 1000, step: 1 };
      }

      // Grace period (if any item has it)
      const grace = hasGrace && graceMonths ? {
        type: 'ReducedRate' as const,
        months: graceMonths,
      } : undefined;
      
      // Combine descriptions from all items (if they differ)
      const descriptions = new Set(groupItems.map(item => item.usl_name).filter(Boolean));
      const description = descriptions.size > 0 
        ? Array.from(descriptions).join('; ')
        : `${baseItem.kredit_type} кредит`;

      // Add bank prefix based on language
      const namePrefixes = {
        ru: 'Беларусбанк - ',
        be: 'Беларусбанк - ',
        en: 'Belarusbank - ',
      };

      // Only set default values if there are no constraints for those fields
      // If constraints exist, let the user choose from the available options
      const hasRateConstraint = constraints.nominalAnnualRatePercent != null;
      const hasTermConstraint = constraints.termMonths != null;
      
      // Parse rate only if no constraint (single value case)
      const displayRate = !hasRateConstraint 
        ? (baseItem.inf_proc_formula 
          ? (typeof baseItem.inf_proc_formula === 'number' 
            ? baseItem.inf_proc_formula 
            : (baseItem.inf_proc_formula.match(/(\d+\.?\d*)/)?.[1] ? parseFloat(baseItem.inf_proc_formula.match(/(\d+\.?\d*)/)![1]) : undefined))
          : undefined)
        : undefined;
      
      // Parse term only if no constraint (single value case)
      // Check if we found multiple terms from baseItem - if so, create constraint instead
      const parsedTermsFromBase = this.parseTerm(baseItem.inf_time, baseItem.usl_name);
      const displayTerm = !hasTermConstraint && parsedTermsFromBase.length === 1
        ? parsedTermsFromBase[0]
        : undefined;
      
      // If we found multiple terms from baseItem but no constraint yet, create one
      if (!hasTermConstraint && parsedTermsFromBase.length > 1) {
        constraints.termMonths = { type: 'enum', values: parsedTermsFromBase.sort((a, b) => a - b) };
      }

      const template: Template = {
        id: templateId,
        name: namePrefixes.en + title, // Default English name
        nameI18n: {
          ru: namePrefixes.ru + title,
          be: namePrefixes.be + title,
          en: namePrefixes.en + title,
        },
        description,
        descriptionI18n: {
          ru: description,
          be: description,
        },
        currency,
        nominalAnnualRatePercent: displayRate,
        termMonths: displayTerm && displayTerm > 0 ? displayTerm : undefined,
        amortization: 'Differentiated', // Default for Belarusbank loans
        dayCount: 'Actual_365',
        prepaymentPolicy: 'ReduceTerm',
        prepaymentsAllowed: true,
        allowFirstPayment: true,
        bankUrl: 'https://belarusbank.by',
        grace,
        constraints,
      };

      if (groupItems.length > 1) {
        console.log(`[BelarusbankAdapter] Grouped ${groupItems.length} loans into template "${title}"`);
      }

      return template;
    });
  }

  /**
   * Parse term from API response
   * Can be number (months) or string (e.g., "120 месяцев")
   * Always checks usl_name for terms (even if inf_time has a value), as usl_name may be more accurate
   * Returns array of all found terms (may contain multiple entries from usl_name)
   */
  private parseTerm(term: string | number | undefined, uslName?: string): number[] {
    const result = new Set<number>();
    
    // First, try to parse from inf_time
    let parsedTerm: number | undefined;
    
    if (term != null) {
      if (typeof term === 'number') {
        parsedTerm = term;
      } else {
        // Try to extract number from string
        const match = String(term).match(/(\d+)/);
        parsedTerm = match ? parseInt(match[1], 10) : undefined;
      }
    }
    
    // If parsed term is valid and > 0, add it (but still check usl_name)
    if (parsedTerm && parsedTerm > 0) {
      result.add(parsedTerm);
    }
    
    // Always check usl_name for terms, as it may have more accurate or additional information
    // usl_name may contain multiple term entries
    if (uslName) {
      const termsFromUslName = this.parseTermFromUslName(uslName);
      for (const termValue of termsFromUslName) {
        result.add(termValue);
      }
    }
    
    return Array.from(result);
  }

  /**
   * Parse all terms from usl_name field
   * Supports formats like:
   * - "6 месяцев", "3 месяца", "1 месяц" (months)
   * - "1 год", "2 года", "5 лет" (years, converted to months)
   * - Multiple entries: "6 месяцев или 12 месяцев", "1 год, 2 года"
   * Case-insensitive
   */
  private parseTermFromUslName(uslName: string): number[] {
    if (!uslName) return [];
    
    const result = new Set<number>(); // Use Set to avoid duplicates
    const lowerName = uslName.toLowerCase();
    
    // Match all patterns like "X месяцев", "X месяца", "X месяц" (months)
    const monthsMatches = lowerName.matchAll(/(\d+)\s*(?:месяц|месяца|месяцев)/g);
    for (const match of monthsMatches) {
      const months = parseInt(match[1], 10);
      if (months > 0) {
        result.add(months);
      }
    }
    
    // Match all patterns like "X год", "X года", "X лет" (years, convert to months)
    const yearsMatches = lowerName.matchAll(/(\d+)\s*(?:год|года|лет)/g);
    for (const yearsMatch of yearsMatches) {
      const years = parseInt(yearsMatch[1], 10);
      if (years > 0) {
        result.add(years * 12); // Convert years to months
      }
    }
    
    // Convert Set to array
    return Array.from(result);
  }
}

