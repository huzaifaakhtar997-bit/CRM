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
    <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col justify-between min-h-[140px] transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-muted-foreground">{title}</h3>
        <div className="p-2 bg-primary/10 text-primary rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-24 bg-accent animate-pulse rounded-md"></div>
        ) : error ? (
          <div className="flex items-center text-destructive text-sm mt-1">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span>Error</span>
          </div>
        ) : (
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tight text-foreground">
              {value?.toLocaleString() || "0"}
            </span>
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
