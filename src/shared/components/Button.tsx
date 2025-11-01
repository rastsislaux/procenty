import React from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

type ButtonProps = {
  variant?: 'solid' | 'ghost' | 'primary-outline' | 'danger-outline' | 'secondary';
  size?: 'sm' | 'md' | 'xs';
  as?: React.ElementType;
  to?: string;
  className?: string;
  children: React.ReactNode;
} & (React.ButtonHTMLAttributes<HTMLButtonElement> | React.AnchorHTMLAttributes<HTMLAnchorElement>);

export function Button({
  variant = 'solid',
  size = 'md',
  className,
  children,
  as,
  to,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const byVariant =
    variant === 'ghost' || variant === 'secondary'
      ? 'bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 shadow-soft hover:shadow-medium focus:ring-primary-500'
      : variant === 'primary-outline'
      ? 'border border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100 shadow-soft hover:shadow-medium focus:ring-primary-500'
      : variant === 'danger-outline'
      ? 'border border-red-300 bg-white text-red-700 hover:bg-red-50 shadow-soft hover:shadow-medium focus:ring-red-500'
      : 'bg-primary-600 hover:bg-primary-700 border border-primary-600 text-white shadow-sm hover:shadow-md focus:ring-primary-500';
  
  const bySize = 
    size === 'xs' 
      ? 'h-auto px-3 py-1.5 text-xs whitespace-nowrap'
      : size === 'sm' 
      ? 'h-8 px-3 text-xs' 
      : 'h-10 px-4 text-sm';
  
  const classes = clsx(base, byVariant, bySize, className);
  
  if (to) {
    return (
      <Link to={to} className={classes} {...(props as any)}>
        {children}
      </Link>
    );
  }
  
  if (as) {
    const Component = as;
    return (
      <Component className={classes} {...(props as any)}>
        {children}
      </Component>
    );
  }
  
  return (
    <button type="button" className={classes} {...(props as any)}>
      {children}
    </button>
  );
}


