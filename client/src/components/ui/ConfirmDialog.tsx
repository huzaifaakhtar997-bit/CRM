import React, { useEffect, useCallback } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "./button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "destructive" | "default";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "destructive",
  loading = false,
  onConfirm,
  onClose,
}) => {
  const displayDescription = description || message || "";
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen || loading) return;
      if (e.key === "Escape") {
        onClose();
      }
    },
    [isOpen, loading, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={() => !loading && onClose()}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative z-10 w-full max-w-md rounded-xl border border-border/80 bg-card p-5 shadow-elevation animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 border ${
              variant === "destructive"
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-primary/10 text-primary border-primary/20"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              id="confirm-dialog-title"
              className="text-sm font-semibold text-foreground leading-tight"
            >
              {title}
            </h3>
            <p
              id="confirm-dialog-description"
              className="text-xs text-muted-foreground mt-1.5 leading-relaxed"
            >
              {displayDescription}
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            aria-label="Close dialog"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5 pt-3.5 border-t border-border/80">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
