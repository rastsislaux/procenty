import { BankApiAdapter, BankAdapterConfig, FetchTemplatesOptions, FetchTemplatesResult, BankApiResponse } from './types';
import { Template } from '../loan-templates';

/**
 * Belarusbank Open Banking API response structure
 * Based on: https://belarusbank.by/site_ru/43105/O_kreditnykh_produktakh_banka.pdf
 */
interface CurrencyTerm {
  amountMin: string | number;
  amountMax: string | number;
  period: string | number;
  periodType: string;
  ownFunds?: string | number;
  interest?: {
    interestRateType?: string;
    rate: string | number;
    gracePeriodInterest?: string | number;
    description?: string;
  };
  guarantee?: Array<{ guaranteeType?: string; description?: string }>;
  paymentDeferment?: Array<{ paymentDefermentType?: string; periodMin?: number; periodMax?: number; periodType?: string }>;
}

interface Currency {
  currency: string;
  term: CurrencyTerm[];
}

interface PaymentDeferment {
  paymentDefermentType: string;
  periodMin?: number;
  periodMax?: number;
  periodType?: string;
}

interface BelarusbankOpenBankingItem {
  loanCategory?: string[];
  loanType?: string[];
  loanForm?: string[];
  applicationType?: string[];
  currency?: Currency[];
  repayment?: {
    repaymentType?: string;
    gracePeriod?: number | string;
  };
  guarantee?: Array<{ guaranteeType?: string; description?: string }>;
  paymentDeferment?: PaymentDeferment[];
  description?: string;
  additionalServices?: string[];
  [key: string]: any; // For additional fields
}

type BelarusbankOpenBankingResponse = BelarusbankOpenBankingItem[];

/**
 * Belarusbank Open Banking API adapter
 * Implements dynamic loading of loan templates from Belarusbank Open Banking API
 */
export class BelarusbankOpenBankingAdapter implements BankApiAdapter {
  readonly bankId = 'belarusbank-open-banking';
  readonly bankName = 'Беларусбанк (Open Banking)';
  
  private readonly config: BankAdapterConfig;
  private cache: { data: Template[]; timestamp: number } | null = null;
  private readonly defaultCacheTtl = 60 * 60 * 1000; // 1 hour

  constructor(config?: Partial<BankAdapterConfig>) {
    this.config = {
      bankId: 'belarusbank-open-banking',
      bankName: 'Беларусбанк (Open Banking)',
      apiBaseUrl: 'https://belarusbank.by/open-banking/v1.0/banks/AKBBBY2X',
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
      let rawResponse: BelarusbankOpenBankingResponse;

      try {
        // Load from static file (no CORS issues)
        const fileResponse = await fetch('/data/belarusbank-open-banking-loans.json');
        if (fileResponse.ok) {
          rawResponse = await fileResponse.json();
          console.log(`[BelarusbankOpenBankingAdapter] Loaded ${rawResponse.length} items from static file`);
          
          // Filter by types if specified
          if (types && types.length > 0) {
            const beforeFilter = rawResponse.length;
            rawResponse = rawResponse.filter((service: any) => {
              const item = service.loan;
              if (!item) return false;
              
              // Match by loanCategory or loanType
              const categoryMatch = item.loanCategory?.some((cat: string) =>
                types.some(type => cat.toLowerCase().includes(type.toLowerCase()))
              );
              const typeMatch = item.loanType?.some((lt: string) => 
                types.some(type => lt.toLowerCase().includes(type.toLowerCase()))
              );
              return categoryMatch || typeMatch;
            });
            console.log(`[BelarusbankOpenBankingAdapter] Filtered to ${rawResponse.length} items (from ${beforeFilter})`);
          }
        } else {
          throw new Error(`Static file not found (HTTP ${fileResponse.status}), falling back to API`);
        }
      } catch (fileError) {
        // Fallback to direct API call (may fail due to CORS)
        console.warn('[BelarusbankOpenBankingAdapter] Failed to load from static file, trying direct API:', fileError);
        
        // Build API URL
        const url = new URL(`${this.config.apiBaseUrl}/loan`);

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
      console.log(`[BelarusbankOpenBankingAdapter] Mapped ${rawResponse.length} items to ${templates.length} templates`);

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
    // Response should be an array of service objects
    if (!Array.isArray(rawResponse)) {
      return false;
    }

    // Basic validation - check if items have required fields
    // Each service has a nested loan object
    return rawResponse.every((item: any) => {
      return (
        item &&
        typeof item === 'object' &&
        item.loan &&
        typeof item.loan === 'object' &&
        item.loan.currency &&
        Array.isArray(item.loan.currency) &&
        item.loan.currency.length > 0
      );
    });
  }

  mapToTemplates(rawResponse: BankApiResponse): Template[] {
    // Response is an array of service objects, each with a nested loan property
    const services = rawResponse as Array<{ 
      id?: string; 
      name?: string;
      currentServiceStatus?: string;
      loan?: BelarusbankOpenBankingItem; 
      [key: string]: any;
    }>;
    const templates: Template[] = [];
    
    for (const service of services) {
      // Filter out non-active services
      if (service.currentServiceStatus && service.currentServiceStatus.toLowerCase() !== 'active') {
        continue;
      }

      const item = service.loan;
      if (!item) {
        console.warn(`[BelarusbankOpenBankingAdapter] Skipping service ${service.id}: no loan data`);
        continue;
      }

      // Get loan name from service.name field
      const loanName = service.name || item.loanCategory?.[0] || item.loanType?.[0] || 'Кредит';
      
      if (!item.currency || !Array.isArray(item.currency) || item.currency.length === 0) {
        console.warn(`[BelarusbankOpenBankingAdapter] Skipping loan "${loanName}": no currency data`);
        continue;
      }

      // Interest rate is nested in currency.term[].interest, not at item level
      // We'll extract it from the first term that has interest data

      // Process each currency
      for (const currencyData of item.currency) {
        if (!currencyData.currency || !currencyData.term || !Array.isArray(currencyData.term) || currencyData.term.length === 0) {
          continue;
        }

        // Map currency code
        const currencyCode = currencyData.currency.toUpperCase();
        const currencyMap: Record<string, 'USD' | 'EUR' | 'BYN' | 'GBP'> = {
          'BYN': 'BYN',
          'USD': 'USD',
          'EUR': 'EUR',
          'GBP': 'GBP',
          'RUB': 'BYN', // Default RUB to BYN
        };
        const currency = currencyMap[currencyCode] || 'BYN';

        // Collect all terms, rates, and amounts from all term entries
        const allTerms = new Set<number>();
        const allAmountMins: number[] = [];
        const allAmountMaxs: number[] = [];
        const allRates = new Map<number, string>(); // Map rate to description/comment
        const allOwnFunds: number[] = [];

        for (const termData of currencyData.term) {
          // Period is in months (periodType should be checked, but assuming months for now)
          const periodNum = typeof termData.period === 'string' ? parseFloat(termData.period) : Number(termData.period);
          if (termData.period && !isNaN(periodNum) && periodNum > 0) {
            // Convert period to months based on periodType
            let months = periodNum;
            if (termData.periodType) {
              switch (termData.periodType.toLowerCase()) {
                case 'year':
                case 'annual':
                case 'год':
                  months = Number(termData.period) * 12;
                  break;
                case 'quarter':
                case 'квартал':
                  months = Number(termData.period) * 3;
                  break;
                case 'semiAnnual':
                case 'полугодие':
                  months = Number(termData.period) * 6;
                  break;
                case 'month':
                case 'месяц':
                default:
                  months = Number(termData.period);
                  break;
              }
            }
            if (months > 0) {
              allTerms.add(months);
            }
          }

          // Collect amounts (may be strings in the API)
          if (termData.amountMin) {
            const min = typeof termData.amountMin === 'string' ? parseFloat(termData.amountMin) : Number(termData.amountMin);
            if (min > 0) {
              allAmountMins.push(min);
            }
          }
          if (termData.amountMax) {
            const max = typeof termData.amountMax === 'string' ? parseFloat(termData.amountMax) : Number(termData.amountMax);
            if (max > 0) {
              allAmountMaxs.push(max);
            }
          }

          // Collect own funds
          if (termData.ownFunds != null) {
            const ownFunds = typeof termData.ownFunds === 'string' ? parseFloat(termData.ownFunds) : Number(termData.ownFunds);
            if (ownFunds >= 0) {
              allOwnFunds.push(ownFunds);
            }
          }

          // Interest rate is nested in termData.interest
          if (termData.interest && typeof termData.interest === 'object') {
            const rate = typeof termData.interest.rate === 'string' 
              ? parseFloat(termData.interest.rate) 
              : Number(termData.interest.rate);
            if (!isNaN(rate) && rate > 0) {
              const rateComment = termData.interest.description || termData.interest.interestRateType || '';
              const existingComment = allRates.get(rate);
              if (existingComment && rateComment && existingComment !== rateComment) {
                allRates.set(rate, `${existingComment}; ${rateComment}`);
              } else if (rateComment) {
                allRates.set(rate, rateComment);
              } else if (!existingComment) {
                allRates.set(rate, '');
              }
            }
          }
        }

        // If no terms found, skip this currency
        if (allTerms.size === 0) {
          continue;
        }

        // If no rates found, skip this currency
        if (allRates.size === 0) {
          console.warn(`[BelarusbankOpenBankingAdapter] Skipping loan "${loanName}" (${currencyCode}): no interest rates found`);
          continue;
        }

        // Sort terms for consistent ordering
        const sortedTerms = Array.from(allTerms).sort((a, b) => a - b);
        const sortedRates = Array.from(allRates.keys()).sort((a, b) => a - b);
        const primaryRate = sortedRates[0];

        // Build template ID (stable, based on loan name and currency)
        const sanitizedLoanName = loanName.toLowerCase().replace(/[^a-z0-9а-я]+/g, '-').replace(/^-|-$/g, '');
        // Create a hash from the loan data to ensure uniqueness
        const loanDataHash = `${loanName}-${currencyCode}-${sortedTerms.join(',')}-${primaryRate}`;
        const hash = Array.from(loanDataHash).reduce((acc, char) => {
          const hash = ((acc << 5) - acc) + char.charCodeAt(0);
          return hash & hash;
        }, 0);
        const templateId = `belarusbank-ob-${sanitizedLoanName}-${currency.toLowerCase()}-${Math.abs(hash)}`;

        // Build constraints
        const constraints: Template['constraints'] = {};

        // Term constraint: enum of all available terms
        if (sortedTerms.length > 0) {
          constraints.termMonths = { 
            type: 'enum', 
            values: sortedTerms
          };
        }

        // Rate constraint: if multiple rates or single rate with description
        if (allRates.size > 0) {
          const ratesArray = Array.from(allRates.keys()).sort((a, b) => a - b);
          if (ratesArray.length > 1 || (ratesArray.length === 1 && allRates.get(ratesArray[0]))) {
            const rateLabels: Record<number, string> = {};
            for (const rateValue of ratesArray) {
              const comment = allRates.get(rateValue);
              if (comment) {
                rateLabels[rateValue] = comment;
              }
            }
            constraints.nominalAnnualRatePercent = { 
              type: 'enum', 
              values: ratesArray,
              labels: Object.keys(rateLabels).length > 0 ? rateLabels : undefined
            };
          }
        }

        // Principal constraint: range from min to max
        const minAmount = allAmountMins.length > 0 ? Math.min(...allAmountMins) : 1000;
        const maxAmount = allAmountMaxs.length > 0 ? Math.max(...allAmountMaxs) : undefined;
        if (maxAmount) {
          constraints.principal = { type: 'range', min: minAmount, max: maxAmount, step: 1 };
        } else {
          constraints.principal = { type: 'range', min: minAmount, step: 1 };
        }

        // Grace period from repayment object or termData.interest.gracePeriodInterest
        let grace: Template['grace'] = undefined;
        
        // Check repayment object for grace period (in days, typically 30)
        let graceDays = 0;
        if (item.repayment && typeof item.repayment === 'object') {
          graceDays = typeof item.repayment.gracePeriod === 'number' 
            ? item.repayment.gracePeriod 
            : (typeof item.repayment.gracePeriod === 'string' ? parseInt(item.repayment.gracePeriod, 10) : 0);
        }
        
        // Check for grace period interest rate in the first term
        let gracePeriodInterest: number | undefined = undefined;
        for (const termData of currencyData.term) {
          if (termData.interest && typeof termData.interest === 'object') {
            const gpi = termData.interest.gracePeriodInterest;
            if (gpi != null) {
              gracePeriodInterest = typeof gpi === 'string' ? parseFloat(gpi) : Number(gpi);
              if (!isNaN(gracePeriodInterest) && gracePeriodInterest > 0) {
                break;
              }
            }
          }
        }
        
        // Convert grace days to months (approximate: 30 days = 1 month)
        if (graceDays > 0) {
          const graceMonths = Math.round(graceDays / 30);
          if (graceMonths > 0) {
            if (gracePeriodInterest != null && gracePeriodInterest > 0) {
              grace = {
                type: 'ReducedRate',
                months: graceMonths,
                reducedAnnualRatePercent: gracePeriodInterest,
              };
            } else {
              grace = {
                type: 'InterestOnly',
                months: graceMonths,
              };
            }
          }
        }

        // Add bank prefix based on language
        const namePrefixes = {
          ru: 'Беларусбанк - ',
          be: 'Беларусбанк - ',
          en: 'Belarusbank - ',
        };

        // Build template name with currency if multiple currencies exist
        const templateName = item.currency.length > 1 
          ? `${loanName} (${currencyCode})`
          : loanName;

        // Only set default values if there are no constraints
        const hasRateConstraint = constraints.nominalAnnualRatePercent != null;
        const hasTermConstraint = constraints.termMonths != null;
        
        const displayRate = !hasRateConstraint && primaryRate > 0 ? primaryRate : undefined;
        const displayTerm = !hasTermConstraint && sortedTerms.length === 1 ? sortedTerms[0] : undefined;

        const template: Template = {
          id: templateId,
          name: namePrefixes.en + templateName,
          nameI18n: {
            ru: namePrefixes.ru + templateName,
            be: namePrefixes.be + templateName,
            en: namePrefixes.en + templateName,
          },
          description: item.description || `${item.loanCategory || item.loanType?.join(', ') || 'Кредит'} кредит`,
          descriptionI18n: {
            ru: item.description || `${item.loanCategory || item.loanType?.join(', ') || 'Кредит'} кредит`,
            be: item.description || `${item.loanCategory || item.loanType?.join(', ') || 'Крэдыт'} крэдыт`,
          },
          currency,
          nominalAnnualRatePercent: displayRate,
          termMonths: displayTerm,
          amortization: 'Differentiated', // Default for Belarusbank loans
          dayCount: 'Actual_365',
          prepaymentPolicy: 'ReduceTerm',
          prepaymentsAllowed: true,
          allowFirstPayment: true,
          bankUrl: 'https://belarusbank.by',
          grace,
          constraints,
        };

        templates.push(template);
      }
    }

    return templates;
  }
}

