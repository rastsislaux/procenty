import React from 'react';
import clsx from 'clsx';

export function TableContainer({ 
  className, 
  children 
}: { 
  className?: string; 
  children: React.ReactNode;
}) {
  return (
    <div className={clsx('overflow-auto border border-neutral-200 rounded-lg shadow-soft', className)}>
      {children}
    </div>
  );
}

export function Table({ 
  className, 
  children 
}: { 
  className?: string; 
  children: React.ReactNode;
}) {
  return (
    <table className={clsx('min-w-full text-sm', className)}>
      {children}
    </table>
  );
}

export function TableHeader({ 
  className, 
  children 
}: { 
  className?: string; 
  children: React.ReactNode;
}) {
  return (
    <thead className={clsx('bg-gradient-to-r from-primary-50 to-primary-100', className)}>
      {children}
    </thead>
  );
}

export function TableHeaderCell({ 
  className, 
  children 
}: { 
  className?: string; 
  children: React.ReactNode;
}) {
  return (
    <th className={clsx('px-4 py-3 text-left text-xs font-semibold text-neutral-900 uppercase tracking-wider', className)}>
      {children}
    </th>
  );
}

export function TableBody({ 
  className, 
  children 
}: { 
  className?: string; 
  children: React.ReactNode;
}) {
  return (
    <tbody className={clsx('bg-white divide-y divide-neutral-200', className)}>
      {children}
    </tbody>
  );
}

export function TableRow({ 
  className, 
  children 
}: { 
  className?: string; 
  children: React.ReactNode;
}) {
  return (
    <tr className={clsx('hover:bg-primary-50/50 transition-colors', className)}>
      {children}
    </tr>
  );
}

type TableCellProps = {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'font-medium';
};

export function TableCell({ 
  className, 
  children,
  variant = 'default'
}: TableCellProps) {
  const baseClasses = 'px-4 py-3';
  const variantClasses = 
    variant === 'font-medium' 
      ? 'font-medium text-neutral-900' 
      : 'text-neutral-700';
  
  return (
    <td className={clsx(baseClasses, variantClasses, className)}>
      {children}
    </td>
  );
}

