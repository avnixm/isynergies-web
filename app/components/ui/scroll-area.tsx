'use client';

import * as React from 'react';
import { cn } from '@/app/lib/utils';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional max height; use className "h-[Npx]" for fixed height. */
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('overflow-auto', className)}
      {...props}
    >
      {children}
    </div>
  )
);
ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
