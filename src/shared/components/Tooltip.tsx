import React from 'react';
import clsx from 'clsx';

type TooltipProps = {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
};

export function Tooltip({ content, children, position = 'top', className }: TooltipProps) {
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <span className={clsx('relative inline-block group', className)}>
      {children}
      <span
        className={clsx(
          'absolute z-50 px-2 py-1 text-xs text-white bg-neutral-900 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-normal max-w-xs transition-opacity',
          positionClasses[position]
        )}
      >
        {content}
      </span>
    </span>
  );
}

// Helper component for info icon with tooltip
export function InfoTooltip({ content, className }: { content: string; className?: string }) {
  return (
    <Tooltip content={content} className={className}>
      <svg
        className="w-4 h-4 text-neutral-400 hover:text-neutral-600 cursor-help"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </Tooltip>
  );
}

