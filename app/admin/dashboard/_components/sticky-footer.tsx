'use client';

import { Save } from 'lucide-react';
import { Button } from '@/app/components/ui/button';

interface StickyFooterProps {
  formId: string;
  saving?: boolean;
  disabled?: boolean;
}

export function StickyFooter({ formId, saving = false, disabled = false }: StickyFooterProps) {
  return (
    <>
      {}
      <div className="h-24" />
      <div className="sticky bottom-0 bg-white border-t border-border shadow-sm p-4 -mx-4 md:-mx-8 px-4 md:px-8 z-50">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <p className="text-sm text-muted-foreground">Review changes, then save.</p>
          <Button type="submit" form={formId} disabled={disabled || saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </>
  );
}
