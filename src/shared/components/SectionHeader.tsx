import React from 'react';
import clsx from 'clsx';

export function SectionHeader({ title, actions, className }: { title: React.ReactNode; actions?: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('flex items-center justify-between', className)}>
      <div className="text-sm font-medium">{title}</div>
      {actions}
    </div>
  );
}


