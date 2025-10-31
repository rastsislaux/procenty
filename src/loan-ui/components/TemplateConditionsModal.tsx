import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Template } from '../../config/loan-templates';
import { useI18n } from '../../i18n/context';
import { getTemplateName } from '../../i18n/utils';

export function TemplateConditionsModal({ 
  template, 
  isOpen, 
  onClose 
}: { 
  template: Template | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { t, language } = useI18n();
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  if (!template) return null;

  const templateName = getTemplateName(template, language);

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

  const formatRate = () => {
    if (template.nominalAnnualRatePercent != null) {
      return template.nominalAnnualRatePercent.toFixed(2) + '%';
    } else if (template.constraints?.nominalAnnualRatePercent) {
      const c = template.constraints.nominalAnnualRatePercent;
      if (c.type === 'range') {
        return (c.min != null ? c.min.toFixed(2) : '') + '% - ' + (c.max != null ? c.max.toFixed(2) : '') + '%';
      } else if (c.type === 'enum') {
        return c.values.join('%, ') + '%';
      }
    }
    return null;
  };

  const formatTerm = () => {
    if (template.termMonths != null) {
      return formatMonths(template.termMonths);
    } else if (template.constraints?.termMonths) {
      const c = template.constraints.termMonths;
      if (c.type === 'enum') {
        return c.values.map(m => formatMonths(m)).join(', ');
      } else if (c.type === 'range') {
        return (c.min != null ? formatMonths(c.min) : '') + 
               (c.min != null && c.max != null ? ' - ' : '') + 
               (c.max != null ? formatMonths(c.max) : '');
      }
    }
    return null;
  };

  const formatPrincipal = () => {
    if (template.constraints?.principal) {
      const c = template.constraints.principal;
      if (c.type === 'range' && c.min != null) {
        let result = c.min.toLocaleString();
        if (c.max != null) {
          result += ' - ' + c.max.toLocaleString();
        }
        return result + ' ' + template.currency;
      }
    }
    return null;
  };

  const formatFirstPayment = () => {
    if (!template.allowFirstPayment) return null;
    if (template.constraints?.firstPaymentPercent) {
      const c = template.constraints.firstPaymentPercent;
      if (c.type === 'range') {
        return (c.min != null ? c.min.toFixed(1) : '') + '% - ' + (c.max != null ? c.max.toFixed(1) : '') + '%';
      }
    }
    return null;
  };

  const formatGracePeriod = () => {
    if (!template.grace) return null;
    const monthWord = template.grace.months === 1 
      ? (language === 'ru' ? 'месяц' : language === 'be' ? 'месяц' : 'month')
      : (language === 'ru' ? 'месяцев' : language === 'be' ? 'месяцаў' : 'months');
    
    if (template.grace.type === 'InterestOnly') {
      return `${template.grace.months} ${monthWord} (${language === 'ru' ? 'только проценты' : language === 'be' ? 'толькі працэнты' : 'interest only'})`;
    } else if (template.grace.type === 'ReducedRate') {
      let result = `${template.grace.months} ${monthWord} (${language === 'ru' ? 'льготная ставка' : language === 'be' ? 'льготная стаўка' : 'reduced rate'}`;
      if (template.grace.reducedAnnualRatePercent != null) {
        result += `: ${template.grace.reducedAnnualRatePercent.toFixed(2)}%`;
      } else if (template.constraints?.graceReducedAnnualRatePercent) {
        const c = template.constraints.graceReducedAnnualRatePercent;
        if (c.type === 'range') {
          result += `: ${c.min != null ? c.min.toFixed(2) : ''}% - ${c.max != null ? c.max.toFixed(2) : ''}%`;
        }
      }
      result += ')';
      return result;
    }
    return null;
  };

  const explanations: Record<string, { ru: string; be: string; en: string }> = {
    amortization: {
      ru: 'Способ амортизации определяет, как распределяется выплата основной суммы долга. Аннуитетный способ — равные ежемесячные платежи на протяжении всего срока кредита. Дифференцированный способ — платежи уменьшаются со временем, так как сначала выплачивается большая часть процентов, а затем основная сумма долга.',
      be: 'Спосаб амартызацыі вызначае, як размяркоўваецца выплата асноўнай сумы доўгу. Ануітэтны спосаб — роўныя штомесячныя плацяжы на працягу ўсяго тэрміну крэдыта. Дыферэнцыяваны спосаб — плацяжы памяншаюцца з часам, бо спачатку выплачваецца большая частка працэнтаў, а затым асноўная сума доўгу.',
      en: 'Amortization method determines how principal repayment is distributed. Annuity method — equal monthly payments throughout the loan term. Differentiated method — payments decrease over time as interest is paid first, then principal.'
    },
    dayCount: {
      ru: 'Метод подсчета дней влияет на расчет процентов. Actual/365 учитывает фактическое количество дней в году (365 или 366). 30E/360 использует упрощенный метод с 30 днями в каждом месяце и 360 днями в году, что упрощает расчеты.',
      be: 'Метад падліку дзён уплывае на разлік працэнтаў. Actual/365 улічвае фактычную колькасць дзён у годзе (365 ці 366). 30E/360 выкарыстоўвае спрашчоны метад з 30 днямі ў кожным месяцы і 360 днямі ў годзе, што спрашчае разлікі.',
      en: 'Day count method affects interest calculation. Actual/365 uses actual days in the year (365 or 366). 30E/360 uses simplified method with 30 days per month and 360 days per year, simplifying calculations.'
    },
    gracePeriod: {
      ru: 'Льготный период — это время, когда применяются особые условия платежей по кредиту. В период льготы может выплачиваться только процентная часть (без основной суммы), либо применяется пониженная процентная ставка. Это позволяет уменьшить нагрузку на заемщика в первые месяцы кредитования.',
      be: 'Льготны перыяд — гэта час, калі прымяняюцца асабовыя ўмовы плацяжоў па крэдыце. У перыяд льготы можа выплачвацца толькі працэнтная частка (без асноўнай сумы), альбо прымяняецца паніжаная працэнтная стаўка. Гэта дазваляе памяншыць нагрузку на пазычальніка ў першыя месяцы крэдытавання.',
      en: 'Grace period is a time when special payment conditions apply. During grace period, only interest may be paid (without principal), or a reduced interest rate may be applied. This reduces borrower burden in the first months of the loan.'
    },
    prepayment: {
      ru: 'Досрочное погашение — это возможность внести дополнительную сумму сверх обычного платежа. При политике "сокращение срока" досрочный платеж уменьшает срок кредита, сохраняя размер ежемесячного платежа. При политике "уменьшение платежа" досрочный платеж уменьшает размер последующих платежей, сохраняя срок кредита.',
      be: 'Датэрміновае пагашэнне — гэта магчымасць унесці дадатковую суму зверх звычайнага плацяжа. Пры палітыцы "скарачэнне тэрміну" датэрміновы плацяж памяншае тэрмін крэдыта, захоўваючы памер штомесячнага плацяжа. Пры палітыцы "памяншэнне плацяжа" датэрміновы плацяж памяншае памер наступных плацяжоў, захоўваючы тэрмін крэдыта.',
      en: 'Prepayment is the ability to pay additional amount beyond the regular payment. With "term reduction" policy, prepayment shortens loan term while keeping monthly payment size. With "installment reduction" policy, prepayment reduces subsequent payment amounts while keeping loan term.'
    }
  };

  const getExplanation = (key: string) => {
    return explanations[key]?.[language as keyof typeof explanations.amortization] || explanations[key]?.en;
  };

  const TermButton = ({ termKey, children }: { termKey: string; children: React.ReactNode }) => (
    <button
      onClick={() => setExpandedTerm(expandedTerm === termKey ? null : termKey)}
      className="font-semibold text-primary-600 hover:text-primary-700 underline decoration-dotted cursor-help inline"
    >
      {children}
    </button>
  );

  // Формируем текст описания
  const renderContent = () => {
    const rate = formatRate();
    const term = formatTerm();
    const principal = formatPrincipal();
    const firstPayment = formatFirstPayment();
    const gracePeriod = formatGracePeriod();

    if (language === 'ru') {
      return (
        <div className="space-y-3 text-base leading-relaxed text-neutral-700">
          <p>
            Кредитный продукт <strong className="text-neutral-900">"{templateName}"</strong> предусматривает следующие условия кредитования.
          </p>
          
          {rate && (
            <p>
              Процентная ставка составляет <strong className="text-neutral-900">{rate}</strong> годовых.
            </p>
          )}

          {term && (
            <p>
              Срок кредита может составлять <strong className="text-neutral-900">{term}</strong>.
            </p>
          )}

          {principal && (
            <p>
              Размер кредита: <strong className="text-neutral-900">{principal}</strong>.
            </p>
          )}

          {firstPayment && (
            <p>
              Требуется первоначальный взнос от <strong className="text-neutral-900">{firstPayment}</strong> от стоимости.
            </p>
          )}

          {template.amortization && (
            <p>
              Кредит использует <TermButton termKey="amortization">
                {template.amortization === 'Annuity' ? 'аннуитетный' : 'дифференцированный'} способ амортизации
              </TermButton>.
            </p>
          )}

          {template.dayCount && (
            <p>
              Подсчет процентов выполняется по методу <TermButton termKey="dayCount">
                {template.dayCount === '30E_360' ? '30E/360' :
                 template.dayCount === 'Actual_365' ? 'Actual/365' : 'Actual/Actual'}
              </TermButton>.
            </p>
          )}

          {gracePeriod && (
            <p>
              Предусмотрен <TermButton termKey="gracePeriod">льготный период</TermButton>: <strong className="text-neutral-900">{gracePeriod}</strong>.
            </p>
          )}

          {template.prepaymentsAllowed && (
            <p>
              Разрешено <TermButton termKey="prepayment">досрочное погашение</TermButton> с политикой{' '}
              <strong className="text-neutral-900">
                {template.prepaymentPolicy === 'ReduceTerm' ? 'сокращение срока кредита' : 'уменьшение размера платежа'}
              </strong>.
            </p>
          )}

          {(template.bankUrl || template.loanUrl) && (
            <p className="text-sm text-neutral-600 italic">
              Более подробную информацию можно найти на официальном сайте банка или на странице кредитного продукта.
            </p>
          )}
        </div>
      );
    } else if (language === 'be') {
      return (
        <div className="space-y-3 text-base leading-relaxed text-neutral-700">
          <p>
            Крэдытны прадукт <strong className="text-neutral-900">"{templateName}"</strong> прадугледжвае наступныя ўмовы крэдытавання.
          </p>
          
          {rate && (
            <p>
              Працэнтная стаўка складае <strong className="text-neutral-900">{rate}</strong> гадавых.
            </p>
          )}

          {term && (
            <p>
              Тэрмін крэдыта можа складаць <strong className="text-neutral-900">{term}</strong>.
            </p>
          )}

          {principal && (
            <p>
              Памер крэдыта: <strong className="text-neutral-900">{principal}</strong>.
            </p>
          )}

          {firstPayment && (
            <p>
              Патрабуецца першапачатковы ўзнос ад <strong className="text-neutral-900">{firstPayment}</strong> ад кошту.
            </p>
          )}

          {template.amortization && (
            <p>
              Крэдыт выкарыстоўвае <TermButton termKey="amortization">
                {template.amortization === 'Annuity' ? 'ануітэтны' : 'дыферэнцыяваны'} спосаб амартызацыі
              </TermButton>.
            </p>
          )}

          {template.dayCount && (
            <p>
              Падлік працэнтаў выконваецца па метаду <TermButton termKey="dayCount">
                {template.dayCount === '30E_360' ? '30E/360' :
                 template.dayCount === 'Actual_365' ? 'Actual/365' : 'Actual/Actual'}
              </TermButton>.
            </p>
          )}

          {gracePeriod && (
            <p>
              Прадугледжаны <TermButton termKey="gracePeriod">льготны перыяд</TermButton>: <strong className="text-neutral-900">{gracePeriod}</strong>.
            </p>
          )}

          {template.prepaymentsAllowed && (
            <p>
              Дапушчаецца <TermButton termKey="prepayment">датэрміновае пагашэнне</TermButton> з палітыкай{' '}
              <strong className="text-neutral-900">
                {template.prepaymentPolicy === 'ReduceTerm' ? 'скарачэнне тэрміну крэдыта' : 'памяншэнне памеру плацяжа'}
              </strong>.
            </p>
          )}

          {(template.bankUrl || template.loanUrl) && (
            <p className="text-sm text-neutral-600 italic">
              Больш падрабязную інфармацыю можна знайсці на афіцыйным сайце банка або на старонцы крэдытнага прадукту.
            </p>
          )}
        </div>
      );
    } else {
      return (
        <div className="space-y-3 text-base leading-relaxed text-neutral-700">
          <p>
            Loan product <strong className="text-neutral-900">"{templateName}"</strong> provides the following loan terms.
          </p>
          
          {rate && (
            <p>
              Interest rate is <strong className="text-neutral-900">{rate}</strong> per annum.
            </p>
          )}

          {term && (
            <p>
              Loan term can be <strong className="text-neutral-900">{term}</strong>.
            </p>
          )}

          {principal && (
            <p>
              Loan amount: <strong className="text-neutral-900">{principal}</strong>.
            </p>
          )}

          {firstPayment && (
            <p>
              Down payment required from <strong className="text-neutral-900">{firstPayment}</strong> of the value.
            </p>
          )}

          {template.amortization && (
            <p>
              The loan uses <TermButton termKey="amortization">
                {template.amortization === 'Annuity' ? 'annuity' : 'differentiated'} amortization
              </TermButton>.
            </p>
          )}

          {template.dayCount && (
            <p>
              Interest calculation uses <TermButton termKey="dayCount">
                {template.dayCount === '30E_360' ? '30E/360' :
                 template.dayCount === 'Actual_365' ? 'Actual/365' : 'Actual/Actual'}
              </TermButton> method.
            </p>
          )}

          {gracePeriod && (
            <p>
              <TermButton termKey="gracePeriod">Grace period</TermButton> provided: <strong className="text-neutral-900">{gracePeriod}</strong>.
            </p>
          )}

          {template.prepaymentsAllowed && (
            <p>
              <TermButton termKey="prepayment">Prepayments</TermButton> are allowed with{' '}
              <strong className="text-neutral-900">
                {template.prepaymentPolicy === 'ReduceTerm' ? 'term reduction' : 'installment reduction'}
              </strong> policy.
            </p>
          )}

          {(template.bankUrl || template.loanUrl) && (
            <p className="text-sm text-neutral-600 italic">
              More detailed information can be found on the bank's official website or on the loan product page.
            </p>
          )}
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white shadow-large max-h-[85vh] overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-neutral-200 flex-shrink-0">
            <Dialog.Title className="text-xl font-semibold text-neutral-900">
              {language === 'ru' ? 'Условия кредита' : language === 'be' ? 'Умовы крэдыта' : 'Loan Terms'}
            </Dialog.Title>
            <p className="text-sm text-neutral-600 mt-1">{templateName}</p>
          </div>
          
          <div className="px-6 py-4 overflow-y-auto flex-1">
            {renderContent()}

            {/* Пояснения к терминам */}
            {expandedTerm && (
              <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="text-sm text-neutral-700 leading-relaxed">
                  <strong className="text-primary-900 block mb-2">
                    {language === 'ru' ? 'Пояснение:' : language === 'be' ? 'Паясненне:' : 'Explanation:'}
                  </strong>
                  <p>{getExplanation(expandedTerm)}</p>
                </div>
              </div>
            )}

            {/* Ссылки на банк */}
            {(template.bankUrl || template.loanUrl) && (
              <div className="mt-6 pt-6 border-t border-neutral-200 space-y-2">
                {template.bankUrl && (
                  <a 
                    href={template.bankUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {language === 'ru' ? 'Официальный сайт банка' : language === 'be' ? 'Афіцыйны сайт банка' : 'Official bank website'}
                  </a>
                )}
                {template.loanUrl && (
                  <a 
                    href={template.loanUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors ml-4"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {language === 'ru' ? 'Страница кредитного продукта' : language === 'be' ? 'Старонка крэдытнага прадукту' : 'Loan product page'}
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-neutral-200 flex-shrink-0 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-700 shadow-soft hover:bg-neutral-50 hover:shadow-medium transition-all duration-200"
            >
              {t.common.close}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
