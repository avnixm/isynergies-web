'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/app/lib/utils';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) throw new Error('DropdownMenu components must be used within DropdownMenu');
  return ctx;
}

type DropdownMenuProps = { children: React.ReactNode; open?: boolean; onOpenChange?: (open: boolean) => void };

function DropdownMenu({ children, open: controlledOpen, onOpenChange }: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolled] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (!isControlled) setUncontrolled(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange]
  );
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        contentRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, setOpen]);

  return (
    <DropdownMenuContext.Provider
      value={{ open, setOpen, triggerRef, contentRef }}
    >
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

function DropdownMenuTrigger({
  className,
  children,
  ...props
}: DropdownMenuTriggerProps) {
  const { open, setOpen, triggerRef } = useDropdownMenu();
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      aria-haspopup="menu"
      onClick={() => setOpen(!open)}
      className={cn(className)}
      {...props}
    >
      {children}
    </button>
  );
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

function DropdownMenuContent({
  className,
  align = 'end',
  sideOffset = 4,
  children,
  ...props
}: DropdownMenuContentProps) {
  const { open, contentRef, triggerRef } = useDropdownMenu();
  const [position, setPosition] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });

  React.useLayoutEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const padding = 8;
    const minW = 128;
    let left = rect.left;
    if (align === 'end') left = rect.right - minW;
    else if (align === 'center') left = rect.left + (rect.width - minW) / 2;
    let top = rect.bottom + sideOffset;
    if (top + 200 > window.innerHeight - padding) top = Math.max(padding, rect.top - 200 - sideOffset);
    if (left < padding) left = padding;
    if (left + minW > window.innerWidth - padding) left = window.innerWidth - minW - padding;
    setPosition({ top, left });
  }, [open, align, sideOffset, triggerRef]);

  if (!open) return null;

  const menu = (
    <div
      ref={contentRef}
      role="menu"
      className={cn(
        'fixed z-[9999] min-w-[8rem] overflow-hidden rounded-xl border border-border bg-white p-1 shadow-lg',
        className
      )}
      style={{ top: position.top, left: position.left }}
      {...props}
    >
      {children}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(menu, document.body) : menu;
}

function DropdownMenuItem({
  className,
  onClick,
  children,
  disabled,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { disabled?: boolean }) {
  const { setOpen } = useDropdownMenu();
  return (
    <div
      role="menuitem"
      tabIndex={-1}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none',
        'hover:bg-muted focus:bg-muted',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        setOpen(false);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
};
