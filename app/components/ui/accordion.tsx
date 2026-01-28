'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/utils';

type AccordionContextValue = {
  type: 'single' | 'multiple';
  value: string | string[];
  onValueChange: (v: string | string[]) => void;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordion() {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error('Accordion components must be used within Accordion');
  return ctx;
}

type AccordionProps = {
  type?: 'single' | 'multiple';
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  className?: string;
  children: React.ReactNode;
};

function Accordion({
  type = 'single',
  value: controlledValue,
  defaultValue,
  onValueChange,
  className,
  children,
}: AccordionProps) {
  const [uncontrolledValue, setUncontrolled] = React.useState<string | string[]>(
    type === 'multiple'
      ? ((defaultValue as string[]) ?? [])
      : ((defaultValue as string) ?? '')
  );
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleChange = React.useCallback(
    (v: string | string[]) => {
      if (!isControlled) setUncontrolled(v);
      onValueChange?.(v);
    },
    [isControlled, onValueChange]
  );

  return (
    <AccordionContext.Provider value={{ type, value, onValueChange: handleChange }}>
      <div className={cn('space-y-1', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

type AccordionItemContextValue = { value: string };

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

function useAccordionItem() {
  const ctx = React.useContext(AccordionItemContext);
  if (!ctx) throw new Error('AccordionTrigger/Content must be used within AccordionItem');
  return ctx;
}

function isValueOpen(value: string | string[], itemValue: string, type: 'single' | 'multiple') {
  if (type === 'single') return value === itemValue;
  return Array.isArray(value) && value.includes(itemValue);
}

type AccordionItemProps = {
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
};

function AccordionItem({ value, className, children, disabled }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div
        data-state={disabled ? 'disabled' : undefined}
        className={cn(
          'overflow-hidden rounded-xl border border-border bg-white shadow-sm',
          disabled && 'pointer-events-none opacity-50',
          className
        )}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

type AccordionTriggerProps = {
  className?: string;
  children: React.ReactNode;
};

function AccordionTrigger({ className, children }: AccordionTriggerProps) {
  const { value } = useAccordionItem();
  const { type, value: accordionValue, onValueChange } = useAccordion();
  const isOpen = isValueOpen(accordionValue, value, type);

  const toggle = () => {
    if (type === 'single') {
      onValueChange(isOpen ? '' : value);
    } else {
      const arr = (Array.isArray(accordionValue) ? accordionValue : []) as string[];
      const next = isOpen ? arr.filter((x) => x !== value) : [...arr, value];
      onValueChange(next);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'flex w-full flex-1 items-center justify-between gap-2 border-0 bg-muted/20 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 first:rounded-t-xl [&[data-state=open]>svg]:rotate-180',
        className
      )}
      data-state={isOpen ? 'open' : 'closed'}
      aria-expanded={isOpen}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  );
}

type AccordionContentProps = {
  className?: string;
  children: React.ReactNode;
};

function AccordionContent({ className, children }: AccordionContentProps) {
  const { value } = useAccordionItem();
  const { type, value: accordionValue } = useAccordion();
  const isOpen = isValueOpen(accordionValue, value, type);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'overflow-hidden border-t border-border px-4 py-3 text-sm',
        'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        className
      )}
      data-state={isOpen ? 'open' : 'closed'}
    >
      {children}
    </div>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
