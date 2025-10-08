/**
 * Semantic Color Components
 * Provides consistent color usage across the application
 */

import React from 'react';
import { cn } from '@/lib/utils';

// Status Badge Component
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'processing' | 'cancelled' | 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'solid';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  children, 
  className = '', 
  variant = 'default' 
}) => {
  const getStatusClasses = () => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'active':
      case 'completed':
      case 'success':
        const successClasses = variant === 'solid' 
          ? 'bg-success text-success-foreground border border-success'
          : 'bg-success-lighter text-success border border-success-light';
        return `${baseClasses} ${successClasses}`;
          
      case 'pending':
      case 'warning':
        const warningClasses = variant === 'solid'
          ? 'bg-warning text-warning-foreground border border-warning'
          : 'bg-warning-lighter text-warning-foreground border border-warning-light';
        return `${baseClasses} ${warningClasses}`;
          
      case 'processing':
      case 'info':
        const infoClasses = variant === 'solid'
          ? 'bg-info text-info-foreground border border-info'
          : 'bg-info-lighter text-info-foreground border border-info-light';
        return `${baseClasses} ${infoClasses}`;
          
      case 'cancelled':
      case 'error':
        const errorClasses = variant === 'solid'
          ? 'bg-error text-error-foreground border border-error'
          : 'bg-error-lighter text-error-foreground border border-error-light';
        return `${baseClasses} ${errorClasses}`;
          
      case 'inactive':
      default:
        const inactiveClasses = variant === 'solid'
          ? 'bg-muted-foreground text-background border border-muted-foreground'
          : 'bg-muted text-muted-foreground border border-border';
        return `${baseClasses} ${inactiveClasses}`;
    }
  };

  return (
    <span className={cn(getStatusClasses(), className)}>
      {children}
    </span>
  );
};

// Granite Type Badge Component
interface GraniteBadgeProps {
  type: 'variant' | 'specific' | 'product' | 'value';
  children: React.ReactNode;
  className?: string;
  count?: number;
}

export const GraniteBadge: React.FC<GraniteBadgeProps> = ({ 
  type, 
  children, 
  className = '',
  count 
}) => {
  const getTypeClasses = () => {
    const baseClasses = 'inline-flex items-center px-3 py-2 rounded-lg font-medium text-sm';
    
    switch (type) {
      case 'variant':
        return `${baseClasses} bg-primary text-primary-foreground`;
      case 'specific':
        return `${baseClasses} bg-purple-50 text-purple-600 border border-purple-200`;
      case 'product':
        return `${baseClasses} bg-success-lighter text-success border border-success-light`;
      case 'value':
        return `${baseClasses} bg-warning-lighter text-warning-foreground border border-warning-light`;
      default:
        return `${baseClasses} bg-muted text-muted-foreground border border-border`;
    }
  };

  return (
    <div className={cn(getTypeClasses(), className)}>
      {children}
      {count !== undefined && (
        <span className="ml-2 px-2 py-1 bg-white/20 rounded-full text-xs">
          {count}
        </span>
      )}
    </div>
  );
};

// Button with semantic colors
interface SemanticButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const SemanticButton: React.FC<SemanticButtonProps> = ({ 
  variant = 'primary',
  size = 'md',
  children, 
  className = '',
  onClick,
  disabled = false,
  type = 'button'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary text-primary-foreground hover:bg-primary/90 border border-primary focus:ring-primary/20';
      case 'secondary':
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border focus:ring-secondary/20';
      case 'success':
        return 'bg-success text-success-foreground hover:bg-success/90 border border-success focus:ring-success/20';
      case 'warning':
        return 'bg-warning text-warning-foreground hover:bg-warning/90 border border-warning focus:ring-warning/20';
      case 'error':
        return 'bg-error text-error-foreground hover:bg-error/90 border border-error focus:ring-error/20';
      case 'info':
        return 'bg-info text-info-foreground hover:bg-info/90 border border-info focus:ring-info/20';
      case 'ghost':
        return 'bg-transparent text-foreground hover:bg-muted border border-transparent focus:ring-primary/20';
      case 'outline':
        return 'bg-transparent text-foreground hover:bg-muted border border-border focus:ring-primary/20';
      default:
        return 'bg-primary text-primary-foreground hover:bg-primary/90 border border-primary focus:ring-primary/20';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      case 'md':
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(baseClasses, getVariantClasses(), getSizeClasses(), className)}
    >
      {children}
    </button>
  );
};

// Semantic Card Component
interface SemanticCardProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const SemanticCard: React.FC<SemanticCardProps> = ({ 
  variant = 'default',
  children, 
  className = '',
  hover = false
}) => {
  const getVariantClasses = () => {
    const hoverClasses = hover ? 'hover:shadow-lg hover:-translate-y-1 transition-all duration-200' : '';
    
    switch (variant) {
      case 'primary':
        return `bg-primary-lighter border border-primary-light ${hoverClasses}`;
      case 'success':
        return `bg-success-lighter border border-success-light ${hoverClasses}`;
      case 'warning':
        return `bg-warning-lighter border border-warning-light ${hoverClasses}`;
      case 'error':
        return `bg-error-lighter border border-error-light ${hoverClasses}`;
      case 'info':
        return `bg-info-lighter border border-info-light ${hoverClasses}`;
      case 'default':
      default:
        return `bg-card border border-border ${hoverClasses}`;
    }
  };

  const baseClasses = 'rounded-lg shadow-sm';

  return (
    <div className={cn(baseClasses, getVariantClasses(), className)}>
      {children}
    </div>
  );
};

// Loading Spinner with semantic colors
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'muted';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-8 w-8';
      case 'md':
      default:
        return 'h-6 w-6';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'border-primary';
      case 'muted':
        return 'border-muted-foreground';
      default:
        return 'border-primary';
    }
  };

  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-2 border-t-transparent',
        getSizeClasses(),
        getVariantClasses(),
        className
      )}
    />
  );
};
