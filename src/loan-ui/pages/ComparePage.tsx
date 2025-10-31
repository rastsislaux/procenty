import React, { useMemo, useState, useEffect, useRef } from 'react';
import { loadTemplates } from '../state/templatesStore';
import { Template } from '../../config/loan-templates';
import { computeBatch } from '../../loan-engine/batch';
import { templateToConfig, validateAgainstConstraints, convertUIEventsToEngine } from '../engineAdapter';
import { FirstPaymentConfig } from '../../loan-engine';
import { ComparePanel } from '../components/ComparePanel';
import { PrepaymentEditor } from '../components/PrepaymentEditor';
import { Select } from '../components/Select';
import { ConstrainedNumberInput } from '../components/ConstrainedNumberInput';
import { useI18n } from '../../i18n/context';
import { getTemplateName } from '../../i18n/utils';
import { IconButton } from '../components/IconButton';
import { ValidationErrors } from './ComparePage/ValidationErrors';
import { ComparePanelWithFade } from './ComparePage/ComparePanelWithFade';
import { TemplateConditionsModal } from '../components/TemplateConditionsModal';

// extracted subcomponents imported above

export function ComparePage({ selectedTemplateIds }: { selectedTemplateIds: string[] }) {
  const { t, language } = useI18n();
  // Load template state only once to avoid identity changes every render triggering effects
  const state = useMemo(() => loadTemplates(), []);
  const all = useMemo(() => [...state.preconfigured, ...state.user], [state]);
  const selected = useMemo(() => all.filter(t => selectedTemplateIds.includes(t.id)), [all, selectedTemplateIds]);
  type PerTemplateInputs = { principal: string; rate?: number; term?: number; firstPayment?: FirstPaymentConfig; prepayments?: any[]; graceReducedRatePercent?: number; graceMonths?: number };
  const [inputs, setInputs] = useState<Record<string, PerTemplateInputs>>({});
  const [results, setResults] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [conditionsModalOpen, setConditionsModalOpen] = useState(false);
  const [selectedTemplateForConditions, setSelectedTemplateForConditions] = useState<Template | null>(null);
  const nameMap = useMemo(() => Object.fromEntries(all.map(t => [t.id, getTemplateName(t, language) || t.id])), [all, language]);

  function ensureInputFor(tpl: Template) {
    setInputs((prev) => {
      if (prev[tpl.id]) return prev;
      const next: PerTemplateInputs = { principal: '20000' };
      if (tpl.allowFirstPayment) {
        next.firstPayment = { type: 'Percent', value: 0 };
      }
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
          const val = validateAgainstConstraints(
            template,
            { ...inp, prepayments: convertedPrepayments },
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
              firstPayment: inp.firstPayment,
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
    <div className="space-y-6">
      <div className="card-base p-5">
          {selected.length > 0 ? (
            <>
              {results.length > 0 && (
                <div className="mb-6">
                  <ComparePanelWithFade results={results} names={nameMap} />
                </div>
              )}
              <div className="mb-4 text-sm font-medium text-neutral-700 bg-primary-50 border border-primary-200 rounded-lg px-4 py-2.5">
                <span className="text-primary-900">{t.compare.title}:</span> <span className="text-primary-700">{selected.map(t => getTemplateName(t, language) || t.id).join(', ')}</span>
              </div>
              <div className="mt-4 space-y-4">
              {selected.map((template) => (
                <div key={template.id} className="card-base p-4 border-l-4 border-l-primary-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-neutral-900">{getTemplateName(template, language) || template.id}</h3>
                      <button
                        onClick={() => {
                          setSelectedTemplateForConditions(template);
                          setConditionsModalOpen(true);
                        }}
                        className="px-2 py-1 rounded border border-primary-300 bg-primary-50 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors"
                        title={language === 'ru' ? 'Условия кредита' : language === 'be' ? 'Умовы крэдыта' : 'Loan Terms'}
                      >
                        {language === 'ru' ? 'Условия' : language === 'be' ? 'Умовы' : 'Terms'}
                      </button>
                      {collapsed[template.id] && errors[template.id] && errors[template.id].length > 0 && (
                        <span className="relative inline-flex group">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300"
                          >
                            {errors[template.id].length}
                          </span>
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-neutral-900 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">
                            {t.compare.validationErrors}: {errors[template.id].length}. {t.common?.show || 'Show'}
                          </span>
                        </span>
                      )}
                    </div>
                    <IconButton
                      label={collapsed[template.id] ? 'Expand' : 'Collapse'}
                      title={collapsed[template.id] ? 'Expand' : 'Collapse'}
                      onClick={() => setCollapsed(prev => ({ ...prev, [template.id]: !prev[template.id] }))}
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
                  <div className={`overflow-hidden transition-[max-height,opacity] duration-[250ms] ${collapsed[template.id] ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'}`}>
                  {/* Main loan parameters - compact horizontal layout */}
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-shrink-0">
                      <label className="block text-xs font-medium text-neutral-700 mb-1.5">{t.calculator.principal}</label>
                      <input className="input-base w-32" value={inputs[template.id]?.principal ?? '20000'} onChange={(e) => updateInput(template.id, { principal: e.target.value })} />
                    </div>
                    {template.nominalAnnualRatePercent == null && (
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-neutral-700 mb-1.5">{t.calculator.rate}</label>
                        <ConstrainedNumberInput
                          value={inputs[template.id]?.rate}
                          onChange={(rate) => updateInput(template.id, { rate })}
                          constraint={template.constraints?.nominalAnnualRatePercent}
                          step={0.01}
                          className="w-24"
                        />
                      </div>
                    )}
                    {template.termMonths == null && (
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-neutral-700 mb-1.5">{t.calculator.termMonths}</label>
                        <ConstrainedNumberInput
                          value={inputs[template.id]?.term}
                          onChange={(term) => updateInput(template.id, { term })}
                          constraint={template.constraints?.termMonths}
                          step={1}
                          className="w-20"
                        />
                      </div>
                    )}
                    {template.grace && template.grace.type === 'ReducedRate' && template.grace.reducedAnnualRatePercent == null && (
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-neutral-700 mb-1.5">{t.templates.reducedRate}</label>
                        <ConstrainedNumberInput
                          value={inputs[template.id]?.graceReducedRatePercent}
                          onChange={(v) => updateInput(template.id, { graceReducedRatePercent: v })}
                          constraint={template.constraints?.graceReducedAnnualRatePercent}
                          step={0.01}
                          className="w-24"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* First payment - inline with main params */}
                  {template.allowFirstPayment && (
                    <div className="flex flex-wrap items-end gap-3 mt-3 pt-3 border-t border-neutral-200">
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-neutral-700 mb-1.5">{t.calculator.firstPaymentType}</label>
                        <Select className="w-32" options={[{ value: 'Percent', label: t.fields.percent }, { value: 'Absolute', label: t.fields.absolute }]} value={inputs[template.id]?.firstPayment?.type ?? 'Percent'} onChange={(v) => updateInput(template.id, { firstPayment: { ...(inputs[template.id]?.firstPayment ?? { value: 0 }), type: v as any } })} />
                      </div>
                      <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-neutral-700 mb-1.5">{t.calculator.firstPaymentValue}</label>
                        <ConstrainedNumberInput
                          value={inputs[template.id]?.firstPayment?.value ?? 0}
                          onChange={(value) => updateInput(template.id, { firstPayment: { ...(inputs[template.id]?.firstPayment ?? { type: 'Percent' as const }), value: value ?? 0 } })}
                          constraint={
                            inputs[template.id]?.firstPayment?.type === 'Percent'
                              ? template.constraints?.firstPaymentPercent
                              : template.constraints?.firstPaymentAbsolute
                          }
                          step={
                            inputs[template.id]?.firstPayment?.type === 'Percent' ? 0.1 : 1
                          }
                          className={inputs[template.id]?.firstPayment?.type === 'Percent' ? 'w-24' : 'w-32'}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Prepayments - full width section */}
                  {template.prepaymentsAllowed && (
                    <div className="mt-3 pt-3 border-t border-neutral-200">
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
              ))}
              </div>
              {selected.length > 0 && results.length === 0 && Object.keys(errors).length === selected.length && (
                <div className="mt-4 text-sm text-neutral-600 italic bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3">{t.compare.noResults}</div>
              )}
            </>
          ) : (
            <div className="text-sm text-neutral-500 italic bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3">
              {t.compare.selectTemplatesBelow}
            </div>
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
    </div>
  );
}

