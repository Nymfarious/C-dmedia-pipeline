import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  className,
  showPercentage = false,
  variant = 'default'
}) => {
  const variants = {
    default: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    destructive: 'bg-destructive',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        {showPercentage && (
          <span className="text-sm font-medium text-muted-foreground">
            {Math.round(value)}%
          </span>
        )}
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className={cn(
            'h-2 rounded-full transition-all duration-300 ease-in-out',
            variants[variant]
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
};