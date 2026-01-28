'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  preventBodyScroll?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  maxWidth = '2xl',
  preventBodyScroll = true,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (preventBodyScroll && open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open, preventBodyScroll]);

  const prevOpenRef = useRef(open);

  // Handle ESC key and focus management
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    // Focus trap for keyboard navigation
    const handleTab = (e: KeyboardEvent) => {
      if (!open || !contentRef.current || e.key !== 'Tab') return;

      const focusableElements = Array.from(
        contentRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[];

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement || !contentRef.current.contains(document.activeElement)) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement || !contentRef.current.contains(document.activeElement)) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTab);
      // Only focus first field when dialog just opened (avoids stealing focus on every parent re-render)
      const justOpened = !prevOpenRef.current;
      prevOpenRef.current = true;
      if (justOpened) {
        setTimeout(() => {
          const firstFocusable = contentRef.current?.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement | null;
          firstFocusable?.focus();
        }, 100);
      }
    } else {
      prevOpenRef.current = false;
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
    };
  }, [open, onOpenChange]);

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-6"
      onClick={handleBackdropClick}
      style={{
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        ref={contentRef}
        className={cn(
          'bg-white rounded-xl shadow-2xl w-full overflow-hidden',
          maxWidthClasses[maxWidth],
          'max-h-[90vh] flex flex-col'
        )}
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 id="dialog-title" className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-1 hover:bg-muted"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 bg-muted/30 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex items-center gap-3', className)}>{children}</div>;
}

