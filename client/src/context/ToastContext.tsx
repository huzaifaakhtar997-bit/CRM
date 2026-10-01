import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { Toast, ToastItem, ToastType } from "../components/ui/Toast";

interface ToastContextValue {
  showToast: (type: ToastType, title: string, description?: string) => void;
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
    warning: (title: string, description?: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = "toast_" + Math.random().toString(36).substring(2) + Date.now();
      const newToast: ToastItem = { id, type, title, description };

      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss after 4 seconds
      setTimeout(() => {
        dismissToast(id);
      }, 4000);
    },
    [dismissToast]
  );

  const toastHelpers = useMemo(
    () => ({
      success: (title: string, description?: string) => showToast("success", title, description),
      error: (title: string, description?: string) => showToast("error", title, description),
      info: (title: string, description?: string) => showToast("info", title, description),
      warning: (title: string, description?: string) => showToast("warning", title, description),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, toast: toastHelpers }}>
      {children}
      {/* Toast container floating in top-right */}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
      >
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
