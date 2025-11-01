import React from 'react';
import clsx from 'clsx';

type BadgeProps = {
  children: React.ReactNode;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
  className?: string;
};

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border';
  
  const variantClasses = {
    success: 'bg-green-100 text-green-700 border-green-300',
    error: 'bg-red-100 text-red-700 border-red-300',
    warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    info: 'bg-blue-100 text-blue-700 border-blue-300',
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  };
  
  return (
    <span className={clsx(base, variantClasses[variant], className)}>
      {children}
    </span>
  );
}

