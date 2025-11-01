import React from 'react';
import clsx from 'clsx';
import { IconButton } from './IconButton';

export function ModalOverlay({ 
  className,
  onClick,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('fixed inset-0 bg-black/40', className)}
      aria-hidden="true"
      onClick={onClick}
      {...props}
    />
  );
}

export function ModalContainer({ 
  className, 
  children,
  onClick,
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  // Handle clicks on container (outside panel) - let them propagate to overlay
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on container, not on children
    if (e.target === e.currentTarget) {
      onClick?.(e);
    }
  };

  return (
    <div 
      className={clsx('fixed inset-0 flex items-center justify-center p-4', className)} 
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
}

type ModalPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  onClose?: () => void;
  showCloseButton?: boolean;
  closeLabel?: string;
};

export function ModalPanel({ 
  className,
  maxWidth = '2xl',
  children,
  onClose,
  showCloseButton = true,
  closeLabel = 'Close',
  ...props 
}: ModalPanelProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  // Prevent clicks inside panel from propagating to overlay
  const handlePanelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    props.onClick?.(e);
  };
  
  return (
    <div
      className={clsx(
        'w-full rounded-lg bg-white shadow-large relative',
        maxWidthClasses[maxWidth],
        className
      )}
      onClick={handlePanelClick}
      {...props}
    >
      {showCloseButton && onClose && (
        <div className="absolute top-4 right-4 z-10">
          <IconButton
            onClick={onClose}
            label={closeLabel}
            title={closeLabel}
            className="bg-white hover:bg-neutral-50"
          >
            <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        </div>
      )}
      {children}
    </div>
  );
}

