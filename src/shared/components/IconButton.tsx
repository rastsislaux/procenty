import React from 'react';

export function IconButton({
  label,
  onClick,
  children,
  className = '',
  title,
  ...props
}: {
  label?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
  [key: string]: any;
}) {
  const tooltip = title || label;
  return (
    <button
      type="button"
      aria-label={label}
      title={tooltip}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white w-8 h-8 hover:bg-neutral-50 hover:shadow-medium transition-all duration-200 relative group shadow-soft ${className}`}
      {...props}
    >
      {children}
      {tooltip && (
        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-neutral-900 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-10">
          {tooltip}
        </span>
      )}
    </button>
  );
}


