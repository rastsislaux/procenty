export type Language = 'en' | 'ru' | 'be';

export interface Translations {
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    remove: string;
    create: string;
    close: string;
    export: string;
    compute: string;
    compare: string;
    schedule: string;
    show: string;
    hide: string;
    select: string;
    selected: string;
  };
  landing: {
    title: string;
    subtitle: string;
    cta: string;
    featuresTitle: string;
    featureCompareTitle: string;
    featureCompareDesc: string;
    featureBelarusBanksTitle: string;
    featureBelarusBanksDesc: string;
    featureTemplatesTitle: string;
    featureTemplatesDesc: string;
    featureExportTitle: string;
    featureExportDesc: string;
    disclaimerTitle: string;
    disclaimerText: string;
  };
  header: {
    title: string;
    contact: string;
  };
  footer: {
    rights: string; // e.g., "© {from} - {to} Your Name. All rights reserved."
  };
  templates: {
    title: string;
    yourTemplates: string;
    preconfigured: string;
    newTemplate: string;
    createTemplate: string;
    editTemplate: string;
    noTemplates: string;
    name: string;
    description: string;
    currency: string;
    amortization: string;
    dayCount: string;
    gracePeriod: string;
    prepaymentPolicy: string;
    allowFirstPayment: string;
    allowPrepayments: string;
    graceType: string;
      graceMonths: string;
      reducedRate: string;
      prepaymentPolicyType: string;
      config: string;
      showConfiguration: string;
      hideConfiguration: string;
    searchPlaceholder: string;
    };
  calculator: {
    title: string;
    template: string;
    principal: string;
    rate: string;
    term: string;
    termMonths: string;
    firstPayment: string;
    firstPaymentType: string;
    firstPaymentValue: string;
    prepayments: string;
    summary: string;
    table: string;
    chart: string;
    exportCSV: string;
  };
  compare: {
    title: string;
    templates: string;
    totalPaid: string;
    totalInterest: string;
    payoffMonth: string;
    maxInstallment: string;
    minInstallment: string;
    installment: string;
    principal: string;
    interest: string;
    validationErrors: string;
    noResults: string;
    selectTemplatesBelow: string;
  };
  schedule: {
    month: string;
    installment: string;
    interest: string;
    principal: string;
    remaining: string;
    exportCSV: string;
  };
  errors: {
    principalRequired: string;
    rateRequired: string;
    termRequired: string;
    termMustBeOneOf: string;
    termMustBeAtLeast: string;
    termMustBeAtMost: string;
    rateMustBeOneOf: string;
    rateMustBeAtLeast: string;
    rateMustBeAtMost: string;
    firstPaymentPercentMin: string;
    firstPaymentPercentMax: string;
    firstPaymentAbsoluteMin: string;
    firstPaymentAbsoluteMax: string;
    graceMonthsMustBeOneOf: string;
    graceMonthsAtLeast: string;
    graceMonthsAtMost: string;
    graceReducedRateMustBeOneOf: string;
    graceReducedRateAtLeast: string;
    graceReducedRateAtMost: string;
  };
  fields: {
    amount: string;
    percent: string;
    absolute: string;
    interestOnly: string;
    reducedRate: string;
    annuity: string;
    differentiated: string;
    reduceTerm: string;
    reduceInstallment: string;
  };
  prepaymentEditor: {
    rangeType: string;
    singleMonth: string;
    range: string;
    month: string;
    startMonth: string;
    endMonth: string;
    step: string;
    stepOptional: string;
    mode: string;
    value: string;
    policy: string;
  };
  loanSummary: {
    totalPaid: string;
    totalInterest: string;
    payoffMonth: string;
    maxInstallment: string;
    minInstallment: string;
  };
}

