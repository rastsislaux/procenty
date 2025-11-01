import React, { useMemo, useState } from 'react';
import { LoanResult } from '../../loan-engine';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Dialog } from '@headlessui/react';
import { ScheduleTable } from './ScheduleTable';
import { useI18n } from '../../i18n/context';
import {
  TableContainer,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '../../shared/components/Table';
import { ModalOverlay, ModalContainer, ModalPanel } from '../../shared/components/Modal';
import { convertCurrencyString, getCachedExchangeRates } from '../../shared/utils/currencyConverter';
import { Select } from '../../shared/components/Select';
import { FormLabel } from '../../shared/components/FormLabel';

export function ComparePanel({ 
  results, 
  names, 
  baseCurrency,
  onBaseCurrencyChange,
  availableCurrencies
}: { 
  results: LoanResult[]; 
  names?: Record<string, string>; 
  baseCurrency?: string;
  onBaseCurrencyChange?: (v: string) => void;
  availableCurrencies?: string[];
}) {
  const { t } = useI18n();
  const [selected, setSelected] = useState<LoanResult | null>(null);
  const [showInstallment, setShowInstallment] = useState(true);
  const [showPrincipal, setShowPrincipal] = useState(false);
  const [showInterest, setShowInterest] = useState(false);
  
  // Get exchange rates for display
  const exchangeRates = useMemo(() => getCachedExchangeRates(), []);
  const chartData = useMemo(() => {
    if (results.length === 0) return [];
    const maxLen = Math.max(...results.map(r => r.schedule.length));
    const rows: any[] = [];
    for (let i = 0; i < maxLen; i++) {
      const row: any = { month: i + 1 };
      for (const r of results) {
        const prefix = names?.[r.id || ''] ?? r.id ?? r.currency;
        const sched = r.schedule[i];
        if (sched) {
          // Convert to base currency if specified and different from result currency
          let installment = Number(String(sched.installment).replace(/,/g, ''));
          let principal = Number(String(sched.principalPortion).replace(/,/g, ''));
          let interest = Number(String(sched.interestPortion).replace(/,/g, ''));
          
          if (baseCurrency && r.currency !== baseCurrency) {
            const fromCurrency = r.currency;
            const toCurrency = baseCurrency;
            installment = Number(convertCurrencyString(sched.installment, fromCurrency, toCurrency).replace(/,/g, ''));
            principal = Number(convertCurrencyString(sched.principalPortion, fromCurrency, toCurrency).replace(/,/g, ''));
            interest = Number(convertCurrencyString(sched.interestPortion, fromCurrency, toCurrency).replace(/,/g, ''));
          }
          
          row[`${prefix} installment`] = installment;
          row[`${prefix} principal`] = principal;
          row[`${prefix} interest`] = interest;
        }
      }
      rows.push(row);
    }
    return rows;
  }, [results, names, baseCurrency]);
  if (results.length === 0) return null;
  return (
    <div className="space-y-5">
      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>{t.compare.templates}</TableHeaderCell>
              <TableHeaderCell>{t.templates.currency}</TableHeaderCell>
              <TableHeaderCell>{t.compare.totalPaid}</TableHeaderCell>
              <TableHeaderCell>{t.compare.totalInterest}</TableHeaderCell>
              <TableHeaderCell>{t.compare.payoffMonth}</TableHeaderCell>
              <TableHeaderCell>{t.compare.maxInstallment}</TableHeaderCell>
              <TableHeaderCell>{t.compare.minInstallment}</TableHeaderCell>
              <TableHeaderCell>{null}</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.id ?? r.currency}>
                <TableCell variant="font-medium">{names?.[r.id || ''] ?? r.id ?? '-'}</TableCell>
                <TableCell>{r.currency}</TableCell>
                <TableCell>{r.meta.totalPaid}</TableCell>
                <TableCell>{r.meta.totalInterest}</TableCell>
                <TableCell>{r.meta.payoffMonth}</TableCell>
                <TableCell>{r.meta.maxInstallment}</TableCell>
                <TableCell>{r.meta.minInstallment}</TableCell>
                <TableCell>
                  <button 
                    onClick={() => setSelected(r)}
                    className="text-primary-600 hover:text-primary-700 font-medium text-xs hover:underline transition-colors"
                  >
                    {t.common.schedule}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <div className="space-y-3">
        <div className="flex items-center gap-4 text-sm border border-neutral-200 rounded-lg p-3 bg-neutral-50">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showInstallment} onChange={(e) => setShowInstallment(e.target.checked)} className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-neutral-700 font-medium">{t.compare.installment}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showPrincipal} onChange={(e) => setShowPrincipal(e.target.checked)} className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-neutral-700 font-medium">{t.compare.principal}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showInterest} onChange={(e) => setShowInterest(e.target.checked)} className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-neutral-700 font-medium">{t.compare.interest}</span>
          </label>
        </div>
        {baseCurrency && availableCurrencies && availableCurrencies.length > 1 && (
          <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-primary-700 flex-1">
                {t.compare.multiCurrencyGraphNote.replace('{currency}', baseCurrency)}
              </span>
              {onBaseCurrencyChange && (
                <div className="flex items-center gap-2">
                  <FormLabel className="mb-0 text-sm font-medium text-primary-900 whitespace-nowrap">
                    {t.compare.baseCurrency}:
                  </FormLabel>
                  <Select
                    options={availableCurrencies.map(c => ({ value: c, label: c }))}
                    value={baseCurrency}
                    onChange={(v) => onBaseCurrencyChange(Array.isArray(v) ? v[0] : v)}
                    className="w-32"
                  />
                </div>
              )}
            </div>
            {(() => {
              // Get currencies that need conversion (different from base currency)
              const currenciesToShow = availableCurrencies.filter(c => c !== baseCurrency);
              if (currenciesToShow.length === 0) return null;
              
              const baseRate = exchangeRates[baseCurrency] ?? 1.0;
              
              return (
                <div className="text-xs text-primary-600 pt-2 border-t border-primary-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-medium text-primary-700">{t.compare.exchangeRates}: </span>
                      {currenciesToShow.map((currency, idx) => {
                        const rate = exchangeRates[currency] ?? 1.0;
                        // Calculate conversion rate: 1 unit of currency = X units of baseCurrency
                        const conversionRate = (rate / baseRate).toFixed(4);
                        return (
                          <span key={currency}>
                            {idx > 0 && ', '}
                            1 {currency} = {conversionRate} {baseCurrency}
                          </span>
                        );
                      })}
                    </div>
                    <a
                      href="https://www.exchangerate-api.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-500 hover:text-primary-600 whitespace-nowrap transition-colors"
                      title={t.compare.ratesByExchangeRateApiTitle}
                    >
                      {t.compare.ratesByExchangeRateApi}
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        <div className="h-80 w-full border border-neutral-200 rounded-lg bg-white p-4 shadow-soft">
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              {results.flatMap((r, idx) => {
                const prefix = names?.[r.id || ''] ?? r.id ?? r.currency;
                const colors = ['#0284c7', '#16a34a', '#ef4444', '#7c3aed', '#f59e0b'];
                const baseColor = colors[idx % colors.length];
                const lines = [];
                if (showInstallment) {
                  lines.push(<Line key={`${prefix}-installment`} type="monotone" dataKey={`${prefix} installment`} stroke={baseColor} dot={false} name={`${prefix} - Installment`} strokeDasharray="5 5" strokeWidth={2} />);
                }
                if (showPrincipal) {
                  lines.push(<Line key={`${prefix}-principal`} type="monotone" dataKey={`${prefix} principal`} stroke={baseColor} dot={false} name={`${prefix} - Principal`} strokeWidth={2} />);
                }
                if (showInterest) {
                  lines.push(<Line key={`${prefix}-interest`} type="monotone" dataKey={`${prefix} interest`} stroke={baseColor} dot={false} name={`${prefix} - Interest`} strokeDasharray="3 3" strokeWidth={2} />);
                }
                return lines;
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Dialog open={!!selected} onClose={() => setSelected(null)} className="relative z-50">
        <ModalOverlay onClick={() => setSelected(null)} />
        <ModalContainer onClick={() => setSelected(null)}>
          <ModalPanel maxWidth="4xl" className="max-h-[80vh] overflow-auto p-6" onClose={() => setSelected(null)} closeLabel={t.common.close}>
            <Dialog.Title className="text-xl font-semibold text-neutral-900 mb-4">
              {t.common.schedule} - {selected && (names?.[selected.id || ''] ?? selected.id ?? selected.currency)}
            </Dialog.Title>
            {selected && <ScheduleTable result={selected} />}
          </ModalPanel>
        </ModalContainer>
      </Dialog>
    </div>
  );
}

