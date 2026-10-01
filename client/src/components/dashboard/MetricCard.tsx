import React from "react";
import { AlertCircle } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | null;
  loading: boolean;
  error: string | null;
  icon: React.ComponentType<any>;
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  loading,
  error,
  icon: Icon,
  subtitle,
}) => {
  return (
    <div className="bg-card border border-border/80 rounded-lg p-4 shadow-2xs hover:border-foreground/20 transition-all flex flex-col justify-between min-h-[116px] group">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
        <div className="w-7 h-7 rounded-md bg-muted/70 text-muted-foreground group-hover:text-foreground flex items-center justify-center border border-border/60 transition-colors">
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      
      <div className="mt-3">
        {loading ? (
          <div className="h-7 w-20 bg-muted/60 animate-pulse rounded"></div>
        ) : error ? (
          <div className="flex items-center text-rose-600 dark:text-rose-400 text-xs">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            <span>Error</span>
          </div>
        ) : (
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-foreground tabular-nums">
              {value?.toLocaleString() || "0"}
            </span>
            {subtitle && (
              <span className="text-[11px] text-muted-foreground font-mono">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
