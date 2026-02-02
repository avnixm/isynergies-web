'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './button';

type UnsavedChangesModalProps = {
  isOpen: boolean;
  onDiscard: () => void;
  onKeepEditing: () => void;
  title?: string;
  message?: string;
};

/**
 * Unsaved Changes Modal
 * 
 * Warns users when they try to close a form/dialog with unsaved changes.
 * Gives them the option to discard changes or continue editing.
 * Designed to be the CENTER OF ATTENTION with animations and prominent styling.
 */
export function UnsavedChangesModal({ 
  isOpen, 
  onDiscard, 
  onKeepEditing,
  title = 'Unsaved Changes',
  message = 'You have unsaved changes. Are you sure you want to close without saving?'
}: UnsavedChangesModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/70 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
      style={{
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={(e) => {
        // Prevent closing on backdrop click - force user to make a choice
        e.stopPropagation();
      }}
    >
      <div 
        className="mx-4 w-full max-w-lg rounded-2xl border-2 border-amber-300 bg-white p-8 shadow-2xl ring-4 ring-amber-500/20"
        style={{
          animation: 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          {/* Icon - no long pulse so no perceived delay */}
          <div 
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg"
            style={{
              animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          >
            <AlertTriangle className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>

          {/* Title */}
          <h2 
            id="unsaved-changes-title" 
            className="mb-3 text-2xl font-bold text-gray-900"
          >
            {title}
          </h2>

          {/* Message */}
          <p className="mb-6 text-base text-gray-700 leading-relaxed">
            {message}
          </p>

          {/* Info about draft - more prominent */}
          <div className="mb-8 w-full rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
            <p className="text-sm font-medium text-blue-900">
              <strong className="text-blue-700">💾 Auto-saved!</strong> Your changes have been saved as a draft. 
              You can restore them the next time you open this form.
            </p>
          </div>

          {/* Action buttons - larger and more prominent */}
          <div className="flex w-full flex-col gap-3">
            <Button
              type="button"
              onClick={onKeepEditing}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
            >
              ✏️ Keep Editing
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onDiscard}
              className="w-full h-12 text-base font-semibold border-2 border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
            >
              🗑️ Close Without Saving
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 10px 25px -5px rgba(251, 191, 36, 0.4);
          }
          50% {
            transform: scale(1.03);
            box-shadow: 0 15px 30px -5px rgba(251, 191, 36, 0.5);
          }
        }
      `}</style>
    </div>
  );
}
