import React from 'react';
import clsx from 'clsx';

export function ChartContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx('w-full h-64', className)}>{children}</div>;
}


