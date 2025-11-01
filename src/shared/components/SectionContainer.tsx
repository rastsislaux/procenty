import React from 'react';
import clsx from 'clsx';

type SectionContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionContainer({ children, className }: SectionContainerProps) {
  return (
    <div className={clsx('border rounded p-3', className)}>
      {children}
    </div>
  );
}

