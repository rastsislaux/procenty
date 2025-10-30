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

function ValidationErrors({ title, errors }: { title: string; errors: string[] }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    // Trigger fade-in right after mount
    const id = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className={`mt-2 rounded border border-red-300 bg-red-50 p-2 transition-opacity duration-[250ms] ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="text-xs font-medium text-red-800 mb-1">{title}:</div>
      <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
        {errors.map((err, idx) => (
          <li key={idx}>{err}</li>
        ))}
      </ul>
    </div>
  );
}

function ComparePanelWithFade({ results, names }: { results: any[]; names: Record<string, string> }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className={`transition-opacity duration-[250ms] ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <ComparePanel results={results} names={names} />
    </div>
  );
}

export function ComparePage({ selectedTemplateIds }: { selectedTemplateIds: string[] }) {
  const { t, language } = useI18n();
  const state = loadTemplates();
  const all = [...state.preconfigured, ...state.user];
  const selected = useMemo(() => all.filter(t => selectedTemplateIds.includes(t.id)), [all, selectedTemplateIds]);
  type PerTemplateInputs = { principal: string; rate?: number; term?: number; firstPayment?: FirstPaymentConfig; prepayments?: any[]; graceReducedRatePercent?: number; graceMonths?: number };
  const [inputs, setInputs] = useState<Record<string, PerTemplateInputs>>({});
  const [results, setResults] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
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
    <div className="space-y-4">
      <div className="rounded border bg-white p-3">
          {selected.length > 0 ? (
            <>
              {results.length > 0 && (
                <ComparePanelWithFade results={results} names={nameMap} />
              )}
              <div className="mb-3 text-sm text-gray-600">
                {t.compare.title}: {selected.map(t => getTemplateName(t, language) || t.id).join(', ')}
              </div>
              <div className="mt-3 space-y-3">
              {selected.map((template) => (
                <div key={template.id} className="rounded border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{getTemplateName(template, language) || template.id}</div>
                      {collapsed[template.id] && errors[template.id] && errors[template.id].length > 0 && (
                        <span className="relative inline-flex group">
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700 border border-red-300"
                          >
                            {errors[template.id].length}
                          </span>
                          <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">
                            {t.compare.validationErrors}: {errors[template.id].length}. {t.common?.show || 'Show'}
                          </span>
                        </span>
                      )}
                    </div>
                    <IconButton
                      label={collapsed[template.id] ? 'Expand' : 'Collapse'}
                      title={collapsed[template.id] ? 'Expand' : 'Collapse'}
                      onClick={() => setCollapsed(prev => ({ ...prev, [template.id]: !prev[template.id] }))}
                      className="w-7 h-7"
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
                  <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">{t.calculator.principal}</label>
                      <input className="mt-1 w-full rounded border px-2 py-2 text-sm" value={inputs[template.id]?.principal ?? '20000'} onChange={(e) => updateInput(template.id, { principal: e.target.value })} />
                    </div>
                    {template.nominalAnnualRatePercent == null && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700">{t.calculator.rate}</label>
                        <ConstrainedNumberInput
                          value={inputs[template.id]?.rate}
                          onChange={(rate) => updateInput(template.id, { rate })}
                          constraint={template.constraints?.nominalAnnualRatePercent}
                          step={0.01}
                        />
                      </div>
                    )}
                    {template.termMonths == null && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700">{t.calculator.termMonths}</label>
                        <ConstrainedNumberInput
                          value={inputs[template.id]?.term}
                          onChange={(term) => updateInput(template.id, { term })}
                          constraint={template.constraints?.termMonths}
                          step={1}
                        />
                      </div>
                    )}
                  </div>
                  {template.grace && template.grace.type === 'ReducedRate' && template.grace.reducedAnnualRatePercent == null && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">{t.templates.reducedRate}</label>
                        <ConstrainedNumberInput
                          value={inputs[template.id]?.graceReducedRatePercent}
                          onChange={(v) => updateInput(template.id, { graceReducedRatePercent: v })}
                          constraint={template.constraints?.graceReducedAnnualRatePercent}
                          step={0.01}
                        />
                      </div>
                    </div>
                  )}
                  {template.allowFirstPayment && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">{t.calculator.firstPaymentType}</label>
                        <div className="mt-1">
                          <Select options={[{ value: 'Percent', label: t.fields.percent }, { value: 'Absolute', label: t.fields.absolute }]} value={inputs[template.id]?.firstPayment?.type ?? 'Percent'} onChange={(v) => updateInput(template.id, { firstPayment: { ...(inputs[template.id]?.firstPayment ?? { value: 0 }), type: v as any } })} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">{t.calculator.firstPaymentValue}</label>
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
                        />
                      </div>
                    </div>
                  )}
                  {template.prepaymentsAllowed && (
                    <div className="mt-2">
                      <PrepaymentEditor
                        events={inputs[template.id]?.prepayments ?? []}
                        onChange={(ev) => updateInput(template.id, { prepayments: ev })}
                      />
                    </div>
                  )}
                  {errors[template.id] && errors[template.id].length > 0 && (
                    <ValidationErrors title={t.compare.validationErrors} errors={errors[template.id]} />
                  )}
                  </div>
                </div>
              ))}
              </div>
              {selected.length > 0 && results.length === 0 && Object.keys(errors).length === selected.length && (
                <div className="mt-3 text-sm text-gray-600 italic">{t.compare.noResults}</div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-500 italic">
              {t.compare.selectTemplatesBelow}
            </div>
          )}
        </div>
    </div>
  );
}

