import React from 'react';
import clsx from 'clsx';

export function DataTable({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="min-w-full border-collapse">{children}</table>
    </div>
  );
}


