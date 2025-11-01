import React from 'react';
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

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="secondary" size="xs" onClick={handleExportCSV}>
          {t.schedule.exportCSV}
        </Button>
      </div>
      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableHeaderCell>{t.schedule.month}</TableHeaderCell>
              <TableHeaderCell>{t.schedule.installment}</TableHeaderCell>
              <TableHeaderCell>{t.schedule.interest}</TableHeaderCell>
              <TableHeaderCell>{t.schedule.principal}</TableHeaderCell>
              <TableHeaderCell>{t.schedule.remaining}</TableHeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {result.schedule.map((r) => (
              <TableRow key={r.monthIndex}>
                <TableCell variant="font-medium">{r.monthIndex}</TableCell>
                <TableCell>{r.installment}</TableCell>
                <TableCell>{r.interestPortion}</TableCell>
                <TableCell>{r.principalPortion}</TableCell>
                <TableCell>{r.remainingPrincipal}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

