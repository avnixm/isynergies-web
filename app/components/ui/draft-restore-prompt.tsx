'use client';

import { RotateCcw, X } from 'lucide-react';
import { Button } from './button';

type DraftRestorePromptProps = {
  savedAt: number;
  onRestore: () => void;
  onDismiss: () => void;
};

/**
 * Draft Restore Prompt
 * 
 * Shows a non-intrusive banner when a restorable draft is detected.
 * Allows user to restore or dismiss the draft.
 */
export function DraftRestorePrompt({ savedAt, onRestore, onDismiss }: DraftRestorePromptProps) {
  // Format the saved time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
          <RotateCcw className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-900">
            Unsaved draft found
          </p>
          <p className="text-xs text-amber-700">
            Last saved {formatTime(savedAt)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDismiss}
          className="h-8 gap-1 border-amber-300 bg-white text-amber-700 hover:bg-amber-100"
        >
          <X className="h-3 w-3" />
          <span className="hidden sm:inline">Dismiss</span>
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={onRestore}
          className="h-8 gap-1 bg-amber-600 text-white hover:bg-amber-700"
        >
          <RotateCcw className="h-3 w-3" />
          Restore
        </Button>
      </div>
    </div>
  );
}
