export type FieldConstraint =
  | { type: 'enum'; values: number[]; labels?: Record<number, string> }
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
    id: "belarusbank-kredit-na-vozvedenie-rekonstrukcii-zhilya",
    name: "Belarusbank - loan for construction and reconstruction of residential buildings",
    nameI18n: {
      ru: "Беларусбанк - Кредит на возведение (реконструкцию) жилья",
      be: "Беларусбанк - Крэдыт на будаўніцтва (рэконструкцыю) жылых дамаў",
    },
    description: "Loan for construction and reconstruction of residential buildings",
    descriptionI18n: {
      ru: "Кредит на возведение (реконструкцию) жилья",
      be: "Крэдыт на будаўніцтва (рэконструкцыю) жылых дамаў",
    },
    currency: 'BYN',
    amortization: 'Differentiated',
    dayCount: 'Actual_365',
    prepaymentPolicy: 'ReduceInstallment',
    prepaymentsAllowed: true,
    allowFirstPayment: true,
    bankUrl: 'https://belarusbank.by',
    loanUrl: 'https://belarusbank.by/ru/fizicheskim_licam/kredit/financing/kredit-na-stroitelstvo',
    constraints: {
      termMonths: { type: 'enum', values: [120, 180, 192, 204, 216, 228, 240] },
      principal: { type: 'range', min: 1000, step: 1 },
      firstPaymentPercent: { type: 'range', min: 10, max: 90, step: 0.1 },
      nominalAnnualRatePercent: {
        type: 'enum',
        values: [13.75],
        labels: {
          13.75: '(по заключаемым кредитным договорам на возведение жилого помещения в многоквартирном жилом доме (в том числе на условиях долевого участия, путем приобретения жилищных облигаций) в период с 01.10.2025 по 30.11.2025 - ставка рефинансирования НБ РБ + 4,00 п.п.)'
        }
      },
    }
  },
  {
    id: 'mtbank-partner-loan-for-real-estate-north-waterfront',
    name: 'MTBank - Partner loan for real estate (North Waterfront)',
    nameI18n: {
      ru: 'МТБанк - Партнерское кредитование недвижимости ЖК «Северный Берег»',
      be: 'МТБанк - Крэдыт ад партнера для нерухомасці ЖК «Паўночны бераг»',
    },
    description: 'Construction and ready housing from the developer LLC «Riverfront Development Limited»',
    descriptionI18n: {
      ru: 'Долевое строительство и готовое жилье от застройщика ООО «Риверсайд Девелопмент Лимитед»',
      be: 'Долевое будаўніцтва і гатовыя жылыя дамы ад забудовніка ООО «Риверсайд Девелопмент Лімітед»',
    },
    currency: 'BYN',
    amortization: 'Annuity',
    dayCount: 'Actual_365',
    prepaymentPolicy: 'ReduceInstallment',
    prepaymentsAllowed: true,
    allowFirstPayment: true,
    grace: {
      type: 'ReducedRate',
      months: 12,
    },
    bankUrl: 'https://www.mtbank.by/',
    loanUrl: 'https://www.mtbank.by/credits/severny-bereg/',
    constraints: {
      termMonths: { type: 'enum', values: [
        12 * 5,
        12 * 6,
        12 * 7,
        12 * 8,
        12 * 9,
        12 * 10,
        12 * 11,
        12 * 12,
        12 * 13,
        12 * 14,
        12 * 15,
        12 * 16,
        12 * 17,
        12 * 18,
        12 * 19,
        12 * 20,
        12 * 21,
        12 * 22,
        12 * 23,
        12 * 24,
        12 * 25,
        12 * 26,
        12 * 27,
        12 * 28,
        12 * 29,
        12 * 30,
      ] },
      principal: { type: 'range', min: 1000, step: 1 },
      firstPaymentPercent: { type: 'range', min: 10, max: 90, step: 0.1 },
      graceMonths: { type: 'enum', values: [12] },
      graceReducedAnnualRatePercent: { type: 'enum', values: [1.99, 2.99, 16.5, 16.6] },
      nominalAnnualRatePercent: { type: 'enum', values: [15.885, 16.92, 16.875, 17.1] },
    },
  }
];

export const USER_TEMPLATES_STORAGE_KEY = 'procenty.userTemplates.v1';

