'use client';

import * as React from 'react';
import { cn } from '@/app/lib/utils';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export function Switch({ className, label, ...props }: SwitchProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
        <input
          type="checkbox"
          className="sr-only"
          {...props}
        />
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform',
            props.checked ? 'translate-x-6' : 'translate-x-1',
            className
          )}
        />
        <span
          className={cn(
            'absolute inset-0 rounded-full transition-colors',
            props.checked ? 'bg-blue-600' : 'bg-gray-300'
          )}
        />
      </div>
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
    </label>
  );
}
