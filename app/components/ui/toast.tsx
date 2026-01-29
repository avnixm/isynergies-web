'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type };
    
    setToasts((prev) => [...prev, newToast]);

    
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  const success = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const error = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const warning = useCallback((message: string) => showToast(message, 'warning'), [showToast]);
  const info = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: 'text-green-900',
        };
      case 'error':
        return {
          bg: 'bg-red-50 border-red-200',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          text: 'text-red-900',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
          text: 'text-yellow-900',
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200',
          icon: <AlertCircle className="h-5 w-5 text-blue-600" />,
          text: 'text-blue-900',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      
      {}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              className={`
                ${styles.bg} ${styles.text}
                border rounded-lg shadow-lg p-4 pr-10
                min-w-[300px] max-w-[500px]
                pointer-events-auto
                animate-slideInRight
                flex items-start gap-3
              `}
              role="alert"
            >
              <div className="flex-shrink-0 mt-0.5">
                {styles.icon}
              </div>
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

