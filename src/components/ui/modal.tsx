import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className
}: ModalProps) {
  // Handle escape key press
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm w-full sm:w-auto',
    md: 'max-w-md w-full sm:w-auto',
    lg: 'max-w-lg w-full sm:w-auto',
    xl: 'max-w-4xl w-full',
    full: 'max-w-6xl w-full'
  };

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div
        className={cn(
          'relative bg-card rounded-lg shadow-xl transform transition-all duration-300 scale-100 opacity-100',
          sizeClasses[size],
          'max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col',
          className
        )}
        style={{ 
          scrollbarGutter: 'stable both-edges'
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Header */}
        {(title || description || showCloseButton) && (
          <div className="flex items-start justify-between p-4 sm:p-6 border-b border-border">
            <div className="flex-1 min-w-0 pr-4">
              {title && (
                <h3
                  id="modal-title"
                  className="text-lg font-semibold text-foreground leading-6 truncate"
                >
                  {title}
                </h3>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-sm text-muted-foreground"
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                className="flex-shrink-0 p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

// Modal Header Component
export function ModalHeader({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

// Modal Title Component
export function ModalTitle({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <h3 className={cn('text-lg font-semibold text-foreground leading-6', className)}>
      {children}
    </h3>
  );
}

// Modal Description Component
export function ModalDescription({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <p className={cn('text-sm text-muted-foreground mt-1', className)}>
      {children}
    </p>
  );
}

// Modal Body Component
export function ModalBody({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );
}

// Modal Footer Component
export function ModalFooter({ 
  children, 
  className 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={cn('flex justify-end gap-3 pt-4 border-t border-border mt-6', className)}>
      {children}
    </div>
  );
}
