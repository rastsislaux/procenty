import React from 'react';
import clsx from 'clsx';

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  size?: 'xs' | 'sm';
  icon?: React.ReactNode;
};

export function Link({ 
  className, 
  children, 
  size = 'sm',
  icon,
  ...props 
}: LinkProps) {
  const base = 'inline-flex items-center font-medium text-primary-600 hover:text-primary-700 transition-colors';
  const sizeClasses = size === 'xs' ? 'gap-1.5 text-xs' : 'gap-2 text-sm';
  
  return (
    <a className={clsx(base, sizeClasses, className)} {...props}>
      {icon}
      {children}
    </a>
  );
}

