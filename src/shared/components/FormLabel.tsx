import React from 'react';
import clsx from 'clsx';

type FormLabelProps = {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
};

export function FormLabel({ children, className, htmlFor }: FormLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={clsx('block text-xs font-medium text-neutral-700 mb-1.5', className)}
    >
      {children}
    </label>
  );
}

