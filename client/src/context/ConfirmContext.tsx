'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for destructive actions */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * App-wide styled replacement for window.confirm().
 * Usage: const confirm = useConfirm(); if (await confirm({ title: 'Delete?' })) ...
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (options && dialog && !dialog.open) dialog.showModal();
  }, [options]);

  const close = (result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    dialogRef.current?.close();
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          e.preventDefault();
          close(false);
        }}
        onClick={(e) => e.target === dialogRef.current && close(false)}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-3xl border border-border-subtle bg-bg-panel p-0 text-text-primary shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        {options && (
          <div className="p-6 space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">{options.title}</h2>
              {options.message && <p className="text-sm text-text-secondary">{options.message}</p>}
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => close(false)} className="btn-secondary text-sm px-5 py-2">
                {options.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => close(true)}
                className={`text-sm px-5 py-2 ${
                  options.danger
                    ? 'inline-flex items-center justify-center rounded-full bg-danger font-semibold text-white hover:opacity-90'
                    : 'btn-primary'
                }`}
              >
                {options.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
