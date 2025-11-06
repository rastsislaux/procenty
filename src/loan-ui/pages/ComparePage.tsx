import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { loadTemplates } from '../state/templatesStore';
import { Template } from '../../config/loan-templates';
import { computeBatch } from '../../loan-engine/batch';
import { templateToConfig, validateAgainstConstraints, convertUIEventsToEngine } from '../engineAdapter';
import { FirstPaymentConfig, LoanResult } from '../../loan-engine';
import { ComparePanel } from '../components/ComparePanel';
import { PrepaymentEditor } from '../components/PrepaymentEditor';
import { ScheduleTable } from '../components/ScheduleTable';
import { Select } from '../../shared/components/Select';
import { NumberInput as ConstrainedNumberInput } from '../../shared/components/NumberInput';
import { useI18n } from '../../i18n/context';
import { getTemplateName } from '../../i18n/utils';
import { IconButton } from '../../shared/components/IconButton';
import { ValidationErrors } from './ComparePage/ValidationErrors';
import { ComparePanelWithFade } from './ComparePage/ComparePanelWithFade';
import { TemplateConditionsModal } from '../components/TemplateConditionsModal';
import { EmptyState } from '../../shared/components/EmptyState';
import { Badge } from '../../shared/components/Badge';
import { Button } from '../../shared/components/Button';
import { convertCurrencyString, getAvailableCurrencies } from '../../shared/utils/currencyConverter';
import { FormLabel } from '../../shared/components/FormLabel';
import { loadAppState, saveAppState, PerTemplateInputs } from '../state/appStateStore';
import { InfoTooltip } from '../../shared/components/Tooltip';
import { ModalOverlay, ModalContainer, ModalPanel } from '../../shared/components/Modal';

// extracted subcomponents imported above

export function ComparePage({ selectedTemplateIds }: { selectedTemplateIds: string[] }) {
  const { t, language } = useI18n();
  // Load template state only once to avoid identity changes every render triggering effects
  const state = useMemo(() => loadTemplates(), []);
  const all = useMemo(() => [...state.preconfigured, ...state.user, ...state.dynamic], [state]);
  const selected = useMemo(() => all.filter(t => selectedTemplateIds.includes(t.id)), [all, selectedTemplateIds]);
  
  // Load initial state from localStorage
  const appState = useMemo(() => loadAppState(), []);
  const [inputs, setInputs] = useState<Record<string, PerTemplateInputs>>(appState.inputs || {});
  const [results, setResults] = useState<LoanResult[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  // Start with all accordions closed by default (don't load collapsed state from localStorage)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    // Initialize all templates as collapsed (closed)
    const initial: Record<string, boolean> = {};
    selectedTemplateIds.forEach(id => {
      initial[id] = true;
    });
    return initial;
  });
  const [conditionsModalOpen, setConditionsModalOpen] = useState(false);
  const [selectedTemplateForConditions, setSelectedTemplateForConditions] = useState<Template | null>(null);
  const [selectedForSchedule, setSelectedForSchedule] = useState<LoanResult | null>(null);
  const nameMap = useMemo(() => Object.fromEntries(all.map(t => [t.id, getTemplateName(t, language) || t.id])), [all, language]);
  
  // Detect if multiple currencies are present
  const currenciesInResults = useMemo(() => {
    const unique = new Set(results.map(r => r.currency));
    return Array.from(unique);
  }, [results]);
  
  const hasMultipleCurrencies = currenciesInResults.length > 1;
  
  // Base currency selector - load from localStorage, default to USD
  const [baseCurrency, setBaseCurrency] = useState<string>(appState.baseCurrency || 'USD');
  
  // Save inputs to localStorage with debouncing
  const saveInputsTimer = useRef<number | null>(null);
  useEffect(() => {
    if (saveInputsTimer.current) {
      clearTimeout(saveInputsTimer.current);
    }
    saveInputsTimer.current = window.setTimeout(() => {
      const currentState = loadAppState();
      saveAppState({
        ...currentState,
        inputs,
      });
    }, 500);
    return () => {
      if (saveInputsTimer.current) {
        clearTimeout(saveInputsTimer.current);
      }
    };
  }, [inputs]);
  
  // Don't save collapsed state - accordions should always start closed by default
  
  // Save base currency to localStorage
  useEffect(() => {
    const currentState = loadAppState();
    saveAppState({
      ...currentState,
      baseCurrency,
    });
  }, [baseCurrency]);
  
  // Update base currency when currencies change
  useEffect(() => {
    if (currenciesInResults.length > 0) {
      // If current base currency is not in available currencies, or if we only have one currency, set it to the first one
      if (!currenciesInResults.includes(baseCurrency) || (!hasMultipleCurrencies && currenciesInResults.length > 0)) {
        setBaseCurrency(currenciesInResults[0]);
      }
    }
  }, [currenciesInResults, hasMultipleCurrencies, baseCurrency]);
  
  // Store original results for tables, conversion will happen in ComparePanel for charts only

  function ensureInputFor(tpl: Template) {
    setInputs((prev) => {
      if (prev[tpl.id]) return prev;
      const next: PerTemplateInputs = { principal: '20000' };
      // Don't initialize firstPayment - let user set it if needed
      // Empty will be treated as 0 in calculations
      if (tpl.grace && tpl.grace.type === 'ReducedRate' && tpl.grace.reducedAnnualRatePercent == null) {
        const c = tpl.constraints?.graceReducedAnnualRatePercent;
        if (c && c.type === 'range' && c.min != null) {
          next.graceReducedRatePercent = c.min;
        }
      }
      return { ...prev, [tpl.id]: next };
    });
  }
  
  // Initialize inputs when templates are selected
  useEffect(() => {
    selected.forEach(t => {
      ensureInputFor(t);
    });
    // Initialize collapsed state for new templates (all closed by default)
    setCollapsed(prev => {
      const next = { ...prev };
      selected.forEach(t => {
        if (!(t.id in next)) {
          next[t.id] = true; // Closed by default
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);
  function updateInput(id: string, patch: Partial<PerTemplateInputs>) {
    setInputs((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { principal: '20000' }), ...patch } }));
  }

  const debounceTimer = useRef<number | null>(null);
  
  // Helper function to interpolate error messages
  const getErrorMsg = (key: string, params?: Record<string, string | number>) => {
    // Strip 'errors.' prefix if present since t.errors already gives us the errors object
    const cleanKey = key.startsWith('errors.') ? key.slice(7) : key;
    const template = (t.errors as any)[cleanKey] || key;
    if (!params) return template;
    return Object.entries(params).reduce((msg, [k, v]) => {
      return msg.replace(`{${k}}`, String(v));
    }, template);
  };

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (selected.length === 0) {
      setResults([]);
      setErrors({});
      return;
    }

    debounceTimer.current = window.setTimeout(() => {
      const cfgs = [] as any[];
      const newErrors: Record<string, string[]> = {};
      
      for (const template of selected) {
        const inp = inputs[template.id] ?? { principal: '20000' };
        try {
          const convertedPrepayments = template.prepaymentsAllowed && inp.prepayments && inp.prepayments.length > 0 ? convertUIEventsToEngine(inp.prepayments) : undefined;
          // Treat undefined firstPayment.value as 0 for validation and calculation
          const firstPaymentForValidation = inp.firstPayment?.value != null 
            ? inp.firstPayment 
            : inp.firstPayment 
              ? { ...inp.firstPayment, value: 0 }
              : undefined;
          
          const val = validateAgainstConstraints(
            template,
            { ...inp, prepayments: convertedPrepayments, firstPayment: firstPaymentForValidation },
            getErrorMsg
          );
          if (!val.ok) {
            // Store validation errors for this template
            newErrors[template.id] = val.messages;
            continue;
          }
          cfgs.push(
            templateToConfig(template, {
              principal: inp.principal,
              rate: inp.rate ?? template.nominalAnnualRatePercent,
              term: inp.term ?? template.termMonths,
              firstPayment: firstPaymentForValidation,
              prepayments: convertedPrepayments,
              graceMonths: inp.graceMonths,
              graceReducedRatePercent: inp.graceReducedRatePercent,
            })
          );
        } catch (err) {
          newErrors[template.id] = [err instanceof Error ? err.message : 'Unknown error'];
          continue;
        }
      }
      
      setErrors(newErrors);
      
      if (cfgs.length > 0) {
        const res = computeBatch(cfgs);
        setResults(res);
      } else {
        setResults([]);
      }
    }, 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [selected, inputs]);

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="card-base p-3 sm:p-5">
          {selected.length > 0 ? (
            <>
              {results.length > 0 && (
                <div className="mb-4 sm:mb-6">
                  <ComparePanelWithFade 
                    results={results} 
                    names={nameMap} 
                    baseCurrency={hasMultipleCurrencies ? baseCurrency : undefined}
                    onBaseCurrencyChange={hasMultipleCurrencies ? (v) => setBaseCurrency(v) : undefined}
                    availableCurrencies={currenciesInResults}
                  />
                </div>
              )}
              <div className="mb-3 sm:mb-4 text-xs sm:text-sm font-medium text-neutral-700 bg-primary-50 border border-primary-200 rounded-lg px-2 sm:px-4 py-2 sm:py-2.5">
                <span className="text-primary-900">{t.compare.title}:</span> <span className="text-primary-700">{selected.map(t => getTemplateName(t, language) || t.id).join(', ')}</span>
              </div>
              <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-4">
              {selected.map((template) => {
                const result = results.find(r => r.id === template.id);
                return (
                <div key={template.id} className="card-base p-3 sm:p-4 border-l-4 border-l-primary-500">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-neutral-900 truncate">{getTemplateName(template, language) || template.id}</h3>
                      <Button
                        variant="primary-outline"
                        size="xs"
                        onClick={() => {
                          setSelectedTemplateForConditions(template);
                          setConditionsModalOpen(true);
                        }}
                        title={language === 'ru' ? 'Условия кредита' : language === 'be' ? 'Умовы крэдыта' : 'Loan Terms'}
                      >
                        {language === 'ru' ? 'Условия' : language === 'be' ? 'Умовы' : 'Terms'}
                      </Button>
                      {collapsed[template.id] && errors[template.id] && errors[template.id].length > 0 && (
                        <span className="relative inline-flex group">
                          <Badge variant="error">
                            {errors[template.id].length}
                          </Badge>
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-neutral-900 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">
                            {t.compare.validationErrors}: {errors[template.id].length}. {t.common?.show || 'Show'}
                          </span>
                        </span>
                      )}
                    </div>
                    <IconButton
                      label={collapsed[template.id] ? 'Expand' : 'Collapse'}
                      title={collapsed[template.id] ? 'Expand' : 'Collapse'}
                      onClick={() => {
                        setCollapsed(prev => {
                          const isCurrentlyOpen = !prev[template.id];
                          if (isCurrentlyOpen) {
                            // If currently open, just close this one
                            return { ...prev, [template.id]: true };
                          } else {
                            // If currently closed, close all others and open this one
                            const next: Record<string, boolean> = {};
                            selected.forEach(t => {
                              next[t.id] = t.id === template.id ? false : true;
                            });
                            return next;
                          }
                        });
                      }}
                      className="w-8 h-8"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`w-4 h-4 transition-transform ${collapsed[template.id] ? '' : 'rotate-180'}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </IconButton>
                  </div>
                  {/* Summary stats - shown when collapsed and results available */}
                  {collapsed[template.id] && result && !errors[template.id] && (() => {
                    const totalPaidNum = Number(result.meta.totalPaid.replace(/,/g, ''));
                    const totalInterestNum = Number(result.meta.totalInterest.replace(/,/g, ''));
                    const interestPercent = totalPaidNum > 0 ? ((totalInterestNum / totalPaidNum) * 100).toFixed(1) : '0.0';
                    return (
                      <div className="flex items-end gap-2 sm:gap-3 mb-2 sm:mb-3 pt-2 sm:pt-3 border-t border-neutral-200">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 flex-1">
                          <div className="text-xs">
                            <div className="text-neutral-500 mb-0.5">{t.loanSummary.totalPaid}</div>
                            <div className="font-semibold text-neutral-900">{result.meta.totalPaid} {result.currency}</div>
                          </div>
                          <div className="text-xs">
                            <div className="text-neutral-500 mb-0.5">{t.loanSummary.totalInterest}</div>
                            <div className="font-semibold text-neutral-900">{result.meta.totalInterest} {result.currency} ({interestPercent}%)</div>
                          </div>
                          <div className="text-xs">
                            <div className="text-neutral-500 mb-0.5">{t.loanSummary.payoffMonth}</div>
                            <div className="font-semibold text-neutral-900">{result.meta.payoffMonth}</div>
                          </div>
                          <div className="text-xs">
                            <div className="text-neutral-500 mb-0.5">{t.loanSummary.maxInstallment} / {t.loanSummary.minInstallment}</div>
                            <div className="font-semibold text-neutral-900 inline-flex items-center gap-1">
                              {result.meta.maxInstallment} <span className="inline-block w-3 h-0.5 bg-neutral-600 relative">
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[4px] border-l-neutral-600 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent"></span>
                              </span> {result.meta.minInstallment}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="primary-outline"
                          size="xs"
                          onClick={() => setSelectedForSchedule(result)}
                          className="flex-shrink-0"
                        >
                          {t.common.schedule}
                        </Button>
                      </div>
                    );
                  })()}
                  <div className={`overflow-hidden transition-[max-height,opacity] duration-[250ms] ${collapsed[template.id] ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
                  {/* Summary stats - shown when expanded */}
                  {!collapsed[template.id] && result && !errors[template.id] && (() => {
                    const totalPaidNum = Number(result.meta.totalPaid.replace(/,/g, ''));
                    const totalInterestNum = Number(result.meta.totalInterest.replace(/,/g, ''));
                    const interestPercent = totalPaidNum > 0 ? ((totalInterestNum / totalPaidNum) * 100).toFixed(1) : '0.0';
                    return (
                      <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-neutral-200">
                        <div className="flex items-end gap-2 sm:gap-3">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 flex-1">
                            <div className="text-xs sm:text-sm">
                              <div className="text-neutral-500 mb-1">{t.loanSummary.totalPaid}</div>
                              <div className="font-semibold text-neutral-900 text-sm sm:text-base">{result.meta.totalPaid} {result.currency}</div>
                            </div>
                            <div className="text-xs sm:text-sm">
                              <div className="text-neutral-500 mb-1">{t.loanSummary.totalInterest}</div>
                              <div className="font-semibold text-neutral-900 text-sm sm:text-base">{result.meta.totalInterest} {result.currency} ({interestPercent}%)</div>
                            </div>
                            <div className="text-xs sm:text-sm">
                              <div className="text-neutral-500 mb-1">{t.loanSummary.payoffMonth}</div>
                              <div className="font-semibold text-neutral-900 text-sm sm:text-base">{result.meta.payoffMonth}</div>
                            </div>
                            <div className="text-xs sm:text-sm">
                              <div className="text-neutral-500 mb-1">{t.loanSummary.maxInstallment} / {t.loanSummary.minInstallment}</div>
                              <div className="font-semibold text-neutral-900 text-sm sm:text-base inline-flex items-center gap-1">
                                {result.meta.maxInstallment} <span className="inline-block w-3 h-0.5 bg-neutral-600 relative">
                                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[4px] border-l-neutral-600 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent"></span>
                                </span> {result.meta.minInstallment}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="primary-outline"
                            size="sm"
                            onClick={() => setSelectedForSchedule(result)}
                            className="flex-shrink-0"
                          >
                            {t.common.schedule}
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                  {/* Main loan parameters - compact horizontal layout */}
                  <div className="flex flex-wrap items-end gap-2 sm:gap-3">
                    <div className="flex-shrink-0">
                      <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                        {t.calculator.principal}
                        <InfoTooltip content={t.tooltips.principal} />
                      </label>
                      <div className="relative inline-flex items-center">
                        <input className="input-base w-24 sm:w-32 pr-8 sm:pr-10 text-xs sm:text-sm" value={inputs[template.id]?.principal ?? '20000'} onChange={(e) => updateInput(template.id, { principal: e.target.value })} />
                        <span className="absolute right-2 sm:right-3 text-xs sm:text-sm text-neutral-500 pointer-events-none">{template.currency}</span>
                      </div>
                    </div>
                    {template.nominalAnnualRatePercent == null && (
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                          {t.calculator.rate}
                          <InfoTooltip content={t.tooltips.rate} />
                        </label>
                        <ConstrainedNumberInput
                          value={inputs[template.id]?.rate}
                          onChange={(rate) => updateInput(template.id, { rate })}
                          constraint={template.constraints?.nominalAnnualRatePercent}
                          step={0.01}
                          className="w-20 sm:w-24"
                          unit="%"
                        />
                      </div>
                    )}
                    {template.termMonths == null && (
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                          {t.calculator.termMonths}
                          <InfoTooltip content={t.tooltips.termMonths} />
                        </label>
                        <ConstrainedNumberInput
                          value={inputs[template.id]?.term}
                          onChange={(term) => updateInput(template.id, { term })}
                          constraint={template.constraints?.termMonths}
                          step={1}
                          className="w-16 sm:w-20"
                          unit={language === 'ru' ? 'мес.' : language === 'be' ? 'мес.' : 'months'}
                        />
                      </div>
                    )}
                    {template.grace && template.grace.type === 'ReducedRate' && template.grace.reducedAnnualRatePercent == null && (
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                          {t.loans.reducedRate}
                          <InfoTooltip content={t.tooltips.graceReducedRate} />
                        </label>
                        <ConstrainedNumberInput
                          value={inputs[template.id]?.graceReducedRatePercent}
                          onChange={(v) => updateInput(template.id, { graceReducedRatePercent: v })}
                          constraint={template.constraints?.graceReducedAnnualRatePercent}
                          step={0.01}
                          className="w-20 sm:w-24"
                          unit="%"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* First payment - inline with main params */}
                  {template.allowFirstPayment && (
                    <div className="flex flex-wrap items-end gap-2 sm:gap-3 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-neutral-200">
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                          {t.calculator.firstPaymentType}
                          <InfoTooltip content={t.tooltips.firstPaymentType} />
                        </label>
                        <Select className="w-28 sm:w-32" options={[{ value: 'Percent', label: t.fields.percent }, { value: 'Absolute', label: t.fields.absolute }]} value={inputs[template.id]?.firstPayment?.type ?? 'Percent'} onChange={(v) => updateInput(template.id, { firstPayment: { ...(inputs[template.id]?.firstPayment ?? { value: 0 }), type: v as any } })} />
                      </div>
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-neutral-700 mb-1 flex items-center gap-1">
                          {t.calculator.firstPaymentValue}
                          <InfoTooltip content={t.tooltips.firstPaymentValue} />
                        </label>
                        {(() => {
                          const firstPaymentType = inputs[template.id]?.firstPayment?.type ?? 'Percent';
                          const isPercent = firstPaymentType === 'Percent';
                          return (
                            <ConstrainedNumberInput
                              value={inputs[template.id]?.firstPayment?.value}
                              onChange={(value) => updateInput(template.id, { firstPayment: { ...(inputs[template.id]?.firstPayment ?? { type: 'Percent' as const }), value: value ?? 0 } })}
                              constraint={
                                isPercent
                                  ? template.constraints?.firstPaymentPercent
                                  : template.constraints?.firstPaymentAbsolute
                              }
                              step={isPercent ? 0.1 : 1}
                              className={isPercent ? 'w-20 sm:w-24' : 'w-28 sm:w-32'}
                              unit={isPercent ? '%' : template.currency}
                              allowEmpty={true}
                            />
                          );
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {/* Prepayments - full width section */}
                  {template.prepaymentsAllowed && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-neutral-200">
                      <PrepaymentEditor
                        events={inputs[template.id]?.prepayments ?? []}
                        onChange={(ev) => updateInput(template.id, { prepayments: ev })}
                      />
                    </div>
                  )}
                  
                  {/* Validation errors */}
                  {errors[template.id] && errors[template.id].length > 0 && (
                    <div className="mt-3">
                      <ValidationErrors title={t.compare.validationErrors} errors={errors[template.id]} />
                    </div>
                  )}
                  </div>
                </div>
              );
              })}
              </div>
              {selected.length > 0 && results.length === 0 && Object.keys(errors).length === selected.length && (
                <div className="mt-4">
                  <EmptyState message={t.compare.noResults} />
                </div>
              )}
            </>
          ) : (
            <EmptyState message={t.compare.selectLoansBelow} />
          )}
        </div>

      <TemplateConditionsModal
        template={selectedTemplateForConditions}
        isOpen={conditionsModalOpen}
        onClose={() => {
          setConditionsModalOpen(false);
          setSelectedTemplateForConditions(null);
        }}
      />

      {/* Payment Schedule Modal */}
      <Dialog open={!!selectedForSchedule} onClose={() => setSelectedForSchedule(null)} className="relative z-50">
        <ModalOverlay onClick={() => setSelectedForSchedule(null)} />
        <ModalContainer onClick={() => setSelectedForSchedule(null)}>
          <ModalPanel maxWidth="4xl" className="max-h-[80vh] overflow-auto p-4 sm:p-6" onClose={() => setSelectedForSchedule(null)} closeLabel={t.common.close}>
            <Dialog.Title className="text-base sm:text-xl font-semibold text-neutral-900 mb-3 sm:mb-4">
              {t.common.schedule} - {selectedForSchedule && (nameMap[selectedForSchedule.id || ''] ?? selectedForSchedule.id ?? selectedForSchedule.currency)}
            </Dialog.Title>
            {selectedForSchedule && <ScheduleTable result={selectedForSchedule} />}
          </ModalPanel>
        </ModalContainer>
      </Dialog>
    </div>
  );
}

