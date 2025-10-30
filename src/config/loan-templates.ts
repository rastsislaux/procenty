export type FieldConstraint =
  | { type: 'enum'; values: number[] }
  | { type: 'range'; min?: number; max?: number; step?: number };

export type Template = {
  id: string;
  name: string;
  nameI18n?: {
    en?: string;
    ru?: string;
    be?: string;
  };
  description?: string;
  descriptionI18n?: {
    en?: string;
    ru?: string;
    be?: string;
  };
  currency?: 'USD'|'EUR'|'BYN'|'GBP';
  nominalAnnualRatePercent?: number;
  termMonths?: number;
  amortization?: 'Annuity'|'Differentiated';
  dayCount?: '30E_360'|'Actual_365'|'Actual_Actual';
  grace?: { type: 'InterestOnly'|'ReducedRate'; months: number; reducedAnnualRatePercent?: number };
  prepaymentPolicy?: 'ReduceTerm'|'ReduceInstallment';
  prepaymentsAllowed?: boolean;
  allowFirstPayment?: boolean;
  constraints?: Partial<Record<
    'termMonths' | 'nominalAnnualRatePercent' | 'principal' |
    'firstPaymentPercent' | 'firstPaymentAbsolute' |
    'graceMonths' | 'graceReducedAnnualRatePercent',
    FieldConstraint
  >>;
};

export const PRECONFIGURED_TEMPLATES: Template[] = [
  {
    id: 'belinvestbank-real-estate-from-partner (Minsk and region)',
    name: 'Belinvestbank - Real estate from partner (Minsk and region)',
    nameI18n: {
      ru: 'Белинвестбанк - Недвижимость от партнера (Минск и область)',
      be: 'Белінвестбанк - Нерухомасць ад партнера (Мінск і вобласць)',
    },
    description: 'Loan for financing real estate (including residential houses) from partner',
    descriptionI18n: {
      ru: 'Кредит на финансирование недвижимости (в т.ч. жилые дома) от партнера',
      be: 'Крэдыт на фінансаванне нерухомасці (у т.л. жылыя дамы) ад партнера',
    },
    currency: 'BYN',
    nominalAnnualRatePercent: 18.11,
    termMonths: undefined,
    amortization: 'Differentiated',
    dayCount: 'Actual_365',
    prepaymentPolicy: 'ReduceInstallment',
    prepaymentsAllowed: true,
    allowFirstPayment: true,
    grace: {
      type: 'ReducedRate',
      months: 12,
    },
    constraints: {
      termMonths: { type: 'enum', values: [120, 240] },
      principal: { type: 'range', min: 1000, step: 1 },
      firstPaymentPercent: { type: 'range', min: 10, max: 90, step: 0.1 },
      graceMonths: { type: 'enum', values: [12] },
      graceReducedAnnualRatePercent: { type: 'range', min: 4.22, max: 11.55, step: 0.01 },
    },
  },
  {
    id: 'belinvestbank-real-estate',
    name: 'Belinvestbank - Real Estate Financing',
    nameI18n: {
      ru: 'Белинвестбанк - На финансирование недвижимости',
      be: 'Белінвестбанк - На фінансаванне нерухомасці',
    },
    description: 'Loan for financing real estate (including residential houses)',
    descriptionI18n: {
      ru: 'Кредит на финансирование недвижимости (в т.ч. жилые дома)',
      be: 'Крэдыт на фінансаванне нерухомасці (у т.л. жылыя дамы)',
    },
    currency: 'BYN',
    // Rate range: 14.3-18.11%, variable rate, user must input
    termMonths: undefined, // 120-240 months (10-20 years), user must choose
    amortization: 'Differentiated',
    dayCount: 'Actual_365',
    prepaymentPolicy: 'ReduceTerm',
    prepaymentsAllowed: true,
    allowFirstPayment: true,
    constraints: {
      termMonths: { type: 'enum', values: [120, 180, 192, 204, 216, 228, 240] }, // 10, 15, 16, 17, 18, 19, 20 years
      nominalAnnualRatePercent: { type: 'range', min: 14.3, max: 18.11, step: 0.01 },
      principal: { type: 'range', min: 1000, step: 1 }, // от 1 000 BYN, до 90% стоимости жилья
      firstPaymentPercent: { type: 'range', min: 10, max: 90, step: 0.1 }, // от 10%
    },
  },
];

export const USER_TEMPLATES_STORAGE_KEY = 'procenty.userTemplates.v1';

