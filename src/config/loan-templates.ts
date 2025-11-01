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
  bankUrl?: string;
  loanUrl?: string;
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
    bankUrl: 'https://belinvestbank.by',
    loanUrl: 'https://myfin.by/bank/belinvestbank/kredity/zhile',
    constraints: {
      termMonths: { type: 'enum', values: [120, 180, 192, 204, 216, 228, 240] }, // 10, 15, 16, 17, 18, 19, 20 years
      nominalAnnualRatePercent: { type: 'range', min: 14.3, max: 18.11, step: 0.01 },
      principal: { type: 'range', min: 1000, step: 1 }, // от 1 000 BYN, до 90% стоимости жилья
      firstPaymentPercent: { type: 'range', min: 10, max: 90, step: 0.1 }, // от 10%
    },
  },
  {
    id: 'belveb-ulasnaya-mayomasts',
    name: 'BelVEB Bank - Ulasnaya Mayomasts',
    nameI18n: {
      ru: 'Банк БелВЭБ - Уласная маёмасць',
      be: 'Банк БелВЭБ - Уласная маёмасць',
    },
    description: 'Housing loan - Ulasnaya Mayomasts',
    descriptionI18n: {
      ru: 'Кредит на жилье - Уласная маёмасць',
      be: 'Крэдыт на жыллё - Уласная маёмасць',
    },
    currency: 'BYN',
    nominalAnnualRatePercent: 18.18,
    termMonths: undefined,
    amortization: 'Differentiated',
    dayCount: 'Actual_365',
    prepaymentPolicy: 'ReduceTerm',
    prepaymentsAllowed: true,
    allowFirstPayment: true,
    bankUrl: 'https://belveb.by',
    loanUrl: 'https://myfin.by/bank/belveb/kredity/zhile',
    constraints: {
      termMonths: { type: 'enum', values: [120, 180, 240] },
      principal: { type: 'range', min: 1000, step: 1 },
      firstPaymentPercent: { type: 'range', min: 10, max: 70, step: 0.1 },
    },
  },
  {
    id: 'belgazprombank-skorogo-novoselya',
    name: 'Belgazprombank - Skorogo Novoselya',
    nameI18n: {
      ru: 'Белгазпромбанк - Скоро новоселье',
      be: 'Белгазпромбанк - Хутка новаселле',
    },
    description: 'Program for purchase and construction of housing - Skorogo Novoselya',
    descriptionI18n: {
      ru: 'Программа для покупки и строительства жилья - Скоро новоселье',
      be: 'Праграма для куплі і будаўніцтва жылля - Хутка новаселле',
    },
    currency: 'BYN',
    nominalAnnualRatePercent: 18.9,
    termMonths: undefined,
    amortization: 'Differentiated',
    dayCount: 'Actual_365',
    prepaymentPolicy: 'ReduceTerm',
    prepaymentsAllowed: true,
    allowFirstPayment: true,
    bankUrl: 'https://belgazprombank.by',
    loanUrl: 'https://myfin.by/bank/belgazprombank/kredity/zhile',
    constraints: {
      termMonths: { type: 'enum', values: [120, 180, 240] },
      principal: { type: 'range', min: 1000, step: 1 },
      firstPaymentPercent: { type: 'range', min: 10, max: 60, step: 0.1 },
    },
  },
  {
    id: 'belagroprombank-housing-construction',
    name: 'Belagroprombank - Housing Construction Loan',
    nameI18n: {
      ru: 'Белагропромбанк - Кредит на строительство жилого помещения',
      be: 'Белагропромбанк - Крэдыт на будаўніцтва жылога памяшкання',
    },
    description: 'Loan for construction of residential premises',
    descriptionI18n: {
      ru: 'Кредит на строительство жилого помещения',
      be: 'Крэдыт на будаўніцтва жылога памяшкання',
    },
    currency: 'BYN',
    nominalAnnualRatePercent: 21.0,
    termMonths: undefined,
    amortization: 'Differentiated',
    dayCount: 'Actual_365',
    prepaymentPolicy: 'ReduceTerm',
    prepaymentsAllowed: true,
    allowFirstPayment: true,
    bankUrl: 'https://www.belapb.by',
    loanUrl: 'https://myfin.by/bank/belagroprombank/kredity/zhile',
    constraints: {
      termMonths: { type: 'enum', values: [120, 180, 240] },
      principal: { type: 'range', min: 1000, step: 1 },
      firstPaymentPercent: { type: 'range', min: 10, max: 50, step: 0.1 },
    },
  },
];

export const USER_TEMPLATES_STORAGE_KEY = 'procenty.userTemplates.v1';

