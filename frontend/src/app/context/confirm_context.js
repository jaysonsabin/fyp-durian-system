"use client";

import { createContext, useContext, useState, useRef, useCallback } from 'react';
import ConfirmDialog from '@/app/components/confirm-dialog';

const ConfirmContext = createContext(null);

/**
 * Promise-based confirm dialog, a drop-in replacement for window.confirm():
 *   const ok = await confirm({ title, message, confirmLabel, cancelLabel });
 */
export function ConfirmProvider({ children }) {
  const [options, setOptions] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((opts) => {
    setOptions(opts);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = (result) => {
    setOptions(null);
    resolverRef.current?.(result);
    resolverRef.current = null;
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog
        open={!!options}
        title={options?.title}
        message={options?.message}
        confirmLabel={options?.confirmLabel}
        cancelLabel={options?.cancelLabel}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmContext);
