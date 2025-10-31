import React from 'react';
import { Template } from '../../config/loan-templates';
import { useI18n } from '../../i18n/context';

export function TemplateConfigView({ template }: { template: Template }) {
  const { t, language } = useI18n();
  
  const features: string[] = [];
  
  // Currency
  if (template.currency) {
    features.push(t.templates.currency + ': ' + template.currency);
  }
  
  // Interest rate
  if (template.nominalAnnualRatePercent != null) {
    features.push(t.calculator.rate.replace('(%)', '') + ': ' + template.nominalAnnualRatePercent.toFixed(2) + '%');
  } else if (template.constraints?.nominalAnnualRatePercent) {
    const c = template.constraints.nominalAnnualRatePercent;
    if (c.type === 'range') {
      features.push(t.calculator.rate.replace('(%)', '') + ': ' + 
        (c.min != null ? c.min.toFixed(2) : '') + '% - ' + 
        (c.max != null ? c.max.toFixed(2) : '') + '%');
    } else if (c.type === 'enum') {
      features.push(t.calculator.rate.replace('(%)', '') + ': ' + c.values.join('%, ') + '%');
    }
  } else {
    features.push(t.calculator.rate.replace('(%)', '') + ': ' + t.common.select.toLowerCase());
  }
  
  // Term
  const formatMonths = (m: number) => {
    const years = Math.floor(m / 12);
    const months = m % 12;
    if (years > 0 && months > 0) {
      const yearWord = years === 1 
        ? (language === 'ru' ? 'год' : language === 'be' ? 'год' : 'year')
        : (language === 'ru' ? 'лет' : language === 'be' ? 'гадоў' : 'years');
      const monthWord = months === 1 
        ? (language === 'ru' ? 'месяц' : language === 'be' ? 'месяц' : 'month')
        : (language === 'ru' ? 'месяцев' : language === 'be' ? 'месяцаў' : 'months');
      return `${years} ${yearWord} ${months} ${monthWord}`;
    } else if (years > 0) {
      const yearWord = years === 1 
        ? (language === 'ru' ? 'год' : language === 'be' ? 'год' : 'year')
        : (language === 'ru' ? 'лет' : language === 'be' ? 'гадоў' : 'years');
      return `${years} ${yearWord}`;
    } else {
      const monthWord = m === 1 
        ? (language === 'ru' ? 'месяц' : language === 'be' ? 'месяц' : 'month')
        : (language === 'ru' ? 'месяцев' : language === 'be' ? 'месяцаў' : 'months');
      return `${m} ${monthWord}`;
    }
  };
  
  if (template.termMonths != null) {
    features.push(t.calculator.termMonths + ': ' + formatMonths(template.termMonths));
  } else if (template.constraints?.termMonths) {
    const c = template.constraints.termMonths;
    if (c.type === 'enum') {
      const terms = c.values.map(m => formatMonths(m));
      features.push(t.calculator.termMonths + ': ' + terms.join(', '));
    } else if (c.type === 'range') {
      const monthWord = language === 'ru' ? 'месяцев' : language === 'be' ? 'месяцаў' : 'months';
      features.push(t.calculator.termMonths + ': ' + 
        (c.min != null ? formatMonths(c.min) : '') + 
        (c.min != null && c.max != null ? ' - ' : '') + 
        (c.max != null ? formatMonths(c.max) : ''));
    }
  } else {
    features.push(t.calculator.termMonths + ': ' + t.common.select.toLowerCase());
  }
  
  // Amortization
  if (template.amortization) {
    features.push(t.templates.amortization + ': ' + (template.amortization === 'Annuity' ? t.fields.annuity : t.fields.differentiated));
  }
  
  // Principal
  if (template.constraints?.principal) {
    const c = template.constraints.principal;
    if (c.type === 'range' && c.min != null) {
      features.push(t.calculator.principal + ': ' + (language === 'ru' ? 'от' : language === 'be' ? 'ад' : 'from') + ' ' + c.min.toLocaleString());
      if (c.max != null) {
        features[features.length - 1] += ' ' + (language === 'ru' ? 'до' : language === 'be' ? 'да' : 'to') + ' ' + c.max.toLocaleString();
      }
    }
  }
  
  // First payment
  if (template.allowFirstPayment) {
    if (template.constraints?.firstPaymentPercent) {
      const c = template.constraints.firstPaymentPercent;
      if (c.type === 'range') {
        features.push(t.calculator.firstPayment + ': ' + 
          (c.min != null ? c.min.toFixed(1) : '') + '% - ' + 
          (c.max != null ? c.max.toFixed(1) : '') + '%');
      }
    } else {
      features.push(t.calculator.firstPayment + ': ' + t.templates.allowFirstPayment.toLowerCase());
    }
  }
  
  // Prepayments
  if (template.prepaymentsAllowed) {
    const policy = template.prepaymentPolicy === 'ReduceTerm' ? t.fields.reduceTerm : t.fields.reduceInstallment;
    features.push(t.templates.allowPrepayments + ' (' + policy.toLowerCase() + ')');
  }
  
  // Grace period
  if (template.grace) {
    const monthWord = template.grace.months === 1 
      ? (language === 'ru' ? 'месяц' : language === 'be' ? 'месяц' : 'month')
      : (language === 'ru' ? 'месяцев' : language === 'be' ? 'месяцаў' : 'months');
    if (template.grace.type === 'InterestOnly') {
      features.push(t.templates.gracePeriod + ': ' + template.grace.months + ' ' + monthWord + ' (' + t.fields.interestOnly.toLowerCase() + ')');
    } else if (template.grace.type === 'ReducedRate') {
      let graceDesc = t.templates.gracePeriod + ': ' + template.grace.months + ' ' + monthWord + ' (' + t.fields.reducedRate.toLowerCase();
      if (template.grace.reducedAnnualRatePercent != null) {
        graceDesc += ': ' + template.grace.reducedAnnualRatePercent.toFixed(2) + '%)';
      } else if (template.constraints?.graceReducedAnnualRatePercent) {
        const c = template.constraints.graceReducedAnnualRatePercent;
        if (c.type === 'range') {
          graceDesc += ': ' + (c.min != null ? c.min.toFixed(2) : '') + '% - ' + (c.max != null ? c.max.toFixed(2) : '') + '%)';
        }
      } else {
        graceDesc += ')';
      }
      features.push(graceDesc);
    }
  }
  
  // Day count
  if (template.dayCount) {
    const dayCountNames: Record<string, string> = {
      '30E_360': '30E/360',
      'Actual_365': 'Actual/365',
      'Actual_Actual': 'Actual/Actual',
    };
    features.push(t.templates.dayCount + ': ' + dayCountNames[template.dayCount] || template.dayCount);
  }
  
  return (
    <div className="mt-2 space-y-2">
      {features.length > 0 && (
        <ul className="text-xs text-neutral-700 space-y-1.5 list-none">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-primary-600 mt-0.5 flex-shrink-0">•</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
      {(template.bankUrl || template.loanUrl) && (
        <div className="mt-3 pt-3 border-t border-neutral-200 space-y-2">
          {template.bankUrl && (
            <a 
              href={template.bankUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {language === 'ru' ? 'Сайт банка' : language === 'be' ? 'Сайт банка' : 'Bank website'}
            </a>
          )}
          {template.loanUrl && (
            <a 
              href={template.loanUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors ml-3"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {language === 'ru' ? 'Страница кредита' : language === 'be' ? 'Старонка крэдыта' : 'Loan page'}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

