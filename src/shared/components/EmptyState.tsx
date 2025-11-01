import React from 'react';
import clsx from 'clsx';

type EmptyStateProps = {
  message?: string;
  className?: string;
  children?: React.ReactNode;
};

export function EmptyState({ message, className, children }: EmptyStateProps) {
  const content = children || message;
  
  return (
    <div className={clsx(
      'text-sm text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3',
      className
    )}>
      {content}
    </div>
  );
}

