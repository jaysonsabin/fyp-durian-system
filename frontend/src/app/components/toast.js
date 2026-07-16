"use client";

import { useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

/**
 * Lightweight toast notifications.
 * Usage:
 *   const { toasts, showToast, dismissToast } = useToasts();
 *   showToast("Saved!", "success");  // or "error"
 *   <ToastStack toasts={toasts} onDismiss={dismissToast} />
 */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success") => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismissToast(id), 4000);
  }, [dismissToast]);

  return { toasts, showToast, dismissToast };
}

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] w-full max-w-sm px-4 space-y-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            toast.type === "error"
              ? "bg-red-50 border-red-100 text-red-700"
              : "bg-white border-green-100 text-gray-700"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
          )}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer flex-shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
