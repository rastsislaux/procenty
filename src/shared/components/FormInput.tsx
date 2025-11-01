import React from 'react';
import clsx from 'clsx';

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export function FormInput({ className, ...props }: FormInputProps) {
  return (
    <input
      className={clsx('input-base', className)}
      {...props}
    />
  );
}

