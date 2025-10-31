import React from 'react';
import clsx from 'clsx';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'ghost';
  size?: 'sm' | 'md';
};

export function Button({
  variant = 'solid',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  const byVariant =
    variant === 'ghost'
      ? 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700 shadow-soft hover:shadow-medium focus:ring-primary-500'
      : 'bg-primary-600 hover:bg-primary-700 border-primary-600 text-white shadow-sm hover:shadow-md focus:ring-primary-500';
  const bySize = size === 'sm' ? 'h-8 px-3 text-xs' : 'h-10 px-4';
  return (
    <button type="button" className={clsx(base, byVariant, bySize, className)} {...props}>
      {children}
    </button>
  );
}


