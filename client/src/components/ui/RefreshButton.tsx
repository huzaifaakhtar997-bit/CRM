import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { triggerGlobalRefresh } from "../../hooks/useRefreshListener";

interface RefreshButtonProps {
  onRefresh?: () => void | Promise<void>;
  className?: string;
  size?: "sm" | "default";
  variant?: "header" | "toolbar";
  label?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  className = "",
  variant = "toolbar",
  label = "Refresh",
}) => {
  const [spinning, setSpinning] = useState(false);

  const handleClick = async () => {
    if (spinning) return;
    setSpinning(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      triggerGlobalRefresh();
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setTimeout(() => setSpinning(false), 600);
    }
  };

  if (variant === "header") {
    return (
      <button
        onClick={handleClick}
        title="Refresh current page content"
        disabled={spinning}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card/80 hover:bg-accent text-muted-foreground hover:text-foreground transition-all shadow-xs active:scale-95 disabled:opacity-75 ${className}`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${spinning ? "animate-spin text-primary" : ""}`} />
        <span className="hidden sm:inline">{label}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      title="Refresh data"
      disabled={spinning}
      className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-accent text-foreground hover:text-accent-foreground transition-all shadow-xs active:scale-95 disabled:opacity-75 ${className}`}
    >
      <RefreshCw className={`w-3.5 h-3.5 ${spinning ? "animate-spin text-primary" : ""}`} />
      <span>{label}</span>
    </button>
  );
};

export default RefreshButton;
