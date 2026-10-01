import React from "react";
import { LifecycleFunnelStep, SourceBreakdownItem } from "../../types/api.types";
import { Filter, Compass, ArrowRight, UserCheck } from "lucide-react";

interface LeadFunnelAnalyticsProps {
  totalContacts: number;
  lifecycleFunnel: LifecycleFunnelStep[];
  leadsBySource: SourceBreakdownItem[];
  loading: boolean;
}

export const LeadFunnelAnalytics: React.FC<LeadFunnelAnalyticsProps> = ({
  totalContacts,
  lifecycleFunnel,
  leadsBySource,
  loading,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-pulse">
        <div className="lg:col-span-2 h-72 bg-card border border-border/80 rounded-lg"></div>
        <div className="h-72 bg-card border border-border/80 rounded-lg"></div>
      </div>
    );
  }

  const getStepColor = (index: number) => {
    switch (index) {
      case 0:
        return "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400";
      case 1:
        return "border-indigo-500/30 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400";
      case 2:
        return "border-purple-500/30 bg-purple-500/5 text-purple-600 dark:text-purple-400";
      case 3:
        return "border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400";
      case 4:
        return "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400";
      default:
        return "border-border bg-card text-foreground";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Lead Conversion Funnel */}
      <div className="lg:col-span-2 bg-card border border-border/80 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
                <Filter className="w-4 h-4 text-purple-500" /> Lead-to-Customer Conversion Funnel
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Progression efficiency across lifecycle stages ({totalContacts} total contacts tracked)
              </p>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded border border-purple-500/20">
              Lifecycle Velocity
            </span>
          </div>

          {/* Step Cards with Visual Funnel Progression */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 mt-4">
            {lifecycleFunnel.map((step, idx) => {
              const isLast = idx === lifecycleFunnel.length - 1;
              const stepStyle = getStepColor(idx);

              return (
                <div key={step.stage} className="relative flex flex-col">
                  <div className={`p-3 border rounded-md flex flex-col justify-between h-32 ${stepStyle} transition-all`}>
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80 block truncate">
                        Step {idx + 1}
                      </span>
                      <div className="text-xs font-semibold mt-0.5 line-clamp-1" title={step.label}>
                        {step.label}
                      </div>
                    </div>

                    <div>
                      <div className="text-xl font-bold font-mono tabular-nums">{step.count}</div>
                      <div className="text-[10px] font-mono tabular-nums opacity-80 mt-0.5">
                        {idx === 0
                          ? `${step.conversionRate}% share`
                          : `${step.conversionRate}% of contacts`}
                      </div>
                    </div>
                  </div>

                  {/* Flow Arrow (except last step) */}
                  {!isLast && (
                    <div className="hidden sm:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-background border border-border items-center justify-center text-muted-foreground shadow-2xs">
                      <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/80 mt-4">
          <span>Overall Funnel Win Rate: <strong className="font-mono tabular-nums text-foreground">{lifecycleFunnel[lifecycleFunnel.length - 1]?.conversionRate || 0}%</strong></span>
          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
            <UserCheck className="w-3.5 h-3.5" /> Stage Transition Tracking
          </span>
        </div>
      </div>

      {/* 2. Lead Acquisition Channels */}
      <div className="bg-card border border-border/80 rounded-lg p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-500" /> Acquisition Sources
            </h3>
            <span className="text-xs text-muted-foreground font-medium">Share of Leads</span>
          </div>

          <div className="space-y-3 mt-2">
            {leadsBySource.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs italic">
                No lead source data available for this timeframe.
              </div>
            ) : (
              leadsBySource.map((src) => (
                <div key={src.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground truncate max-w-[150px]">
                      {src.label}
                    </span>
                    <span className="font-bold font-mono tabular-nums text-foreground">
                      {src.count} ({src.percentage}%)
                    </span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, src.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-border/80 mt-4 text-[11px] text-muted-foreground text-center">
          Origin channel of inbound contacts & customers
        </div>
      </div>
    </div>
  );
};
