'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, AlertTriangle } from 'lucide-react';
import { Button } from './button';

type SessionExpiredModalProps = {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
};

/**
 * Session Expired Modal
 * 
 * Shown when the user's session expires while they are working.
 * Does NOT cause a hard reload - allows user to navigate to login
 * while potentially preserving unsaved work in localStorage drafts.
 */
export function SessionExpiredModal({ isOpen, onClose, message }: SessionExpiredModalProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

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

  const handleLogin = () => {
    setIsNavigating(true);
    onClose();
    // Use SPA navigation - no hard reload
    router.push('/admin/login');
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
    >
      <div className="mx-4 w-full max-w-md rounded-xl border border-border bg-white p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>

          {/* Title */}
          <h2 
            id="session-expired-title" 
            className="mb-2 text-xl font-semibold text-gray-900"
          >
            Session Expired
          </h2>

          {/* Message */}
          <p className="mb-6 text-sm text-gray-600">
            {message || 'Your session has expired. Please log in again to continue.'}
          </p>

          {/* Info about drafts */}
          <div className="mb-6 w-full rounded-lg bg-blue-50 p-3 text-left">
            <p className="text-xs text-blue-700">
              <strong>Don't worry!</strong> Any unsaved form data has been saved as a draft. 
              You can restore it after logging back in.
            </p>
          </div>

          {/* Action button */}
          <Button
            onClick={handleLogin}
            disabled={isNavigating}
            className="w-full gap-2"
          >
            <LogIn className="h-4 w-4" />
            {isNavigating ? 'Redirecting...' : 'Go to Login'}
          </Button>
        </div>
      </div>
    </div>
  );
}
