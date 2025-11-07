import React, { useState } from 'react';
import { LoanResult, toCSV } from '../../loan-engine';
import { useI18n } from '../../i18n/context';
import { Button } from '../../shared/components/Button';
import {
  TableContainer,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '../../shared/components/Table';

export function ScheduleTable({ result }: { result: LoanResult }) {
  const { t } = useI18n();
  const hasInflation = result.schedule.length > 0 && result.schedule[0].installmentPV != null;
  const [showInflation, setShowInflation] = useState(hasInflation);
  
  function handleExportCSV() {
    const csv = toCSV(result);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `loan-schedule-${result.id || result.currency || 'loan'}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const usePV = hasInflation && showInflation;

  return (
    <div className="space-y-2 sm:space-y-3">
      <div className="flex items-center justify-between">
        {hasInflation && (
          <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm">
            <input 
              type="checkbox" 
              checked={showInflation} 
              onChange={(e) => setShowInflation(e.target.checked)} 
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" 
            />
            <span className="text-neutral-700 font-medium">
              {t.schedule.showInflation}
            </span>
          </label>
        )}
        <div className={hasInflation ? '' : 'ml-auto'}>
          <Button variant="secondary" size="xs" onClick={handleExportCSV}>
            {t.schedule.exportCSV}
          </Button>
        </div>
      </div>
      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>{t.schedule.month}</TableHeaderCell>
              <TableHeaderCell>{usePV ? (t.schedule.installmentPV || t.schedule.installment) : t.schedule.installment}</TableHeaderCell>
              <TableHeaderCell>{usePV ? (t.schedule.interestPV || t.schedule.interest) : t.schedule.interest}</TableHeaderCell>
              <TableHeaderCell>{usePV ? (t.schedule.principalPV || t.schedule.principal) : t.schedule.principal}</TableHeaderCell>
              <TableHeaderCell>{usePV ? (t.schedule.remainingPV || t.schedule.remaining) : t.schedule.remaining}</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {result.schedule.map((r) => (
              <TableRow key={r.monthIndex}>
                <TableCell variant="font-medium" className="text-xs sm:text-sm">{r.monthIndex}</TableCell>
                <TableCell className="text-xs sm:text-sm">{usePV ? (r.installmentPV || r.installment) : r.installment}</TableCell>
                <TableCell className="text-xs sm:text-sm">{usePV ? (r.interestPortionPV || r.interestPortion) : r.interestPortion}</TableCell>
                <TableCell className="text-xs sm:text-sm">{usePV ? (r.principalPortionPV || r.principalPortion) : r.principalPortion}</TableCell>
                <TableCell className="text-xs sm:text-sm">{usePV ? (r.remainingPrincipalPV || r.remainingPrincipal) : r.remainingPrincipal}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

