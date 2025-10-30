import React, { useMemo, useState } from 'react';
import { PRECONFIGURED_TEMPLATES, Template } from '../../config/loan-templates';
import { loadTemplates } from '../state/templatesStore';
import { Combobox, Tab } from '@headlessui/react';
import { templateToConfig, validateAgainstConstraints, convertUIEventsToEngine } from '../engineAdapter';
import { computeLoan, toCSV, FirstPaymentConfig } from '../../loan-engine';
import { LoanSummary } from '../components/LoanSummary';
import { ScheduleTable } from '../components/ScheduleTable';
import { ScheduleChart } from '../components/ScheduleChart';
import { Select } from '../components/Select';
import { IconButton } from '../components/IconButton';
import { PrepaymentEditor } from '../components/PrepaymentEditor';

export function CalculatorPage() {
  const state = loadTemplates();
  const all = [...state.preconfigured, ...state.user];
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Template | null>(all[0] ?? null);
  const [principal, setPrincipal] = useState('20000');
  const [rate, setRate] = useState<number | undefined>(selected?.nominalAnnualRatePercent);
  const [term, setTerm] = useState<number | undefined>(selected?.termMonths);
  const [result, setResult] = useState<ReturnType<typeof computeLoan> | null>(null);
  const [firstType, setFirstType] = useState<FirstPaymentConfig['type']>('Percent');
  const [firstValue, setFirstValue] = useState<number>(0);
  const [prepayEvents, setPrepayEvents] = useState<any[]>([]);
  const filtered = query === ''
    ? all
    : all.filter(t => t.name?.toLowerCase().includes(query.toLowerCase()) || t.id.toLowerCase().includes(query.toLowerCase()));

  function compute() {
    if (!selected) return;
    const firstPayment = (selected.allowFirstPayment ? { type: firstType, value: firstValue } : undefined) as FirstPaymentConfig | undefined;
    const convertedPrepayments = selected.prepaymentsAllowed && prepayEvents.length > 0 ? convertUIEventsToEngine(prepayEvents) : undefined;
    const val = validateAgainstConstraints(selected, { principal, rate, term, firstPayment, prepayments: convertedPrepayments });
    if (!val.ok) { alert(val.messages.join('\n')); return; }
    const cfg = templateToConfig(selected, { principal, rate, term, firstPayment, prepayments: convertedPrepayments });
    const res = computeLoan(cfg);
    setResult(res);
  }

  function exportCSV() {
    if (!result) return;
    const blob = new Blob([toCSV(result)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selected?.id ?? 'loan'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Calculator</h1>
      <div className="rounded border bg-white p-3">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700">Template</label>
            <Select
              options={all.map((t) => ({ value: t.id, label: t.name || t.id }))}
              value={selected?.id ?? null}
              onChange={(v) => { const id = v as string; const t = all.find(tt => tt.id === id) || null; setSelected(t); setRate(t?.nominalAnnualRatePercent); setTerm(t?.termMonths); }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Principal</label>
              <input className="mt-1 w-full rounded border px-3 py-2" value={principal} onChange={(e) => setPrincipal(e.target.value)} />
            </div>
            {selected?.nominalAnnualRatePercent == null && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Rate (%)</label>
                <input type="number" step="0.01" className="mt-1 w-full rounded border px-3 py-2" value={rate ?? ''} onChange={(e) => setRate(e.target.value === '' ? undefined : Number(e.target.value))} />
              </div>
            )}
            {selected?.termMonths == null && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Term (months)</label>
                <input type="number" className="mt-1 w-full rounded border px-3 py-2" value={term ?? ''} onChange={(e) => setTerm(e.target.value === '' ? undefined : Number(e.target.value))} />
              </div>
            )}
          </div>

          {selected?.allowFirstPayment && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First payment type</label>
                <Select
                  options={[{ value: 'Percent', label: 'Percent' }, { value: 'Absolute', label: 'Absolute' }]}
                  value={firstType}
                  onChange={(v) => setFirstType(v as any)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">First payment value</label>
                <input type="number" step="0.01" className="mt-1 w-full rounded border px-3 py-2" value={firstValue} onChange={(e) => setFirstValue(Number(e.target.value))} />
              </div>
            </div>
          )}

          {selected?.prepaymentsAllowed && (
            <div className="mt-3">
              <div className="text-sm font-medium">Prepayment events</div>
              <PrepaymentEditor events={prepayEvents} onChange={setPrepayEvents} />
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={compute}>Compute</button>
            <button className="px-4 py-2 rounded border" onClick={exportCSV} disabled={!result}>Export CSV</button>
          </div>
        </div>

      {result && (
        <Tab.Group>
          <Tab.List className="flex gap-2">
            <Tab className={({ selected }) => selected ? 'px-3 py-2 rounded bg-blue-600 text-white' : 'px-3 py-2 rounded border'}>Summary</Tab>
            <Tab className={({ selected }) => selected ? 'px-3 py-2 rounded bg-blue-600 text-white' : 'px-3 py-2 rounded border'}>Table</Tab>
            <Tab className={({ selected }) => selected ? 'px-3 py-2 rounded bg-blue-600 text-white' : 'px-3 py-2 rounded border'}>Chart</Tab>
          </Tab.List>
          <Tab.Panels className="mt-3">
            <Tab.Panel><LoanSummary result={result} /></Tab.Panel>
            <Tab.Panel><ScheduleTable result={result} /></Tab.Panel>
            <Tab.Panel><ScheduleChart result={result} /></Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      )}
    </div>
  );
}

