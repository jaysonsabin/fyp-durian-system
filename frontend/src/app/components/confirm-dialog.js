"use client";

import { AlertTriangle } from 'lucide-react';

/**
 * In-app replacement for window.confirm(). Renders nothing when `open` is false.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isBusy = false
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={isBusy ? undefined : onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="bg-white rounded-lg w-full max-w-sm p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle size={22} className="text-red-500" />
        </div>
        <h3 className="font-extrabold text-gray-800 text-center text-sm mb-1.5">{title}</h3>
        <p className="text-xs text-gray-500 text-center leading-relaxed whitespace-pre-line mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="flex-1 px-4 py-2.5 rounded-lg text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isBusy}
            className="flex-1 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isBusy && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
