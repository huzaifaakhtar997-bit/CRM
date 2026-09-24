import React, { useState } from "react";
import { RevenueTrendItem, StageBreakdownItem } from "../../types/api.types";
import { DollarSign, TrendingUp, Target, Coins, Layers, ArrowUpRight } from "lucide-react";

interface RevenueAnalyticsProps {
  totalWonRevenue: number;
  wonDealsCount: number;
  totalPipelineValue: number;
  openDealsCount: number;
  averageDealValue: number;
  winRate: number;
  revenueTrend: RevenueTrendItem[];
  dealsByStage: StageBreakdownItem[];
  loading: boolean;
}

export const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({
  totalWonRevenue,
  wonDealsCount,
  totalPipelineValue,
  openDealsCount,
  averageDealValue,
  winRate,
  revenueTrend,
  dealsByStage,
  loading,
}) => {
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-card border rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-card border rounded-xl"></div>
          <div className="h-72 bg-card border rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Calculate maximum revenue for SVG bar scaling
  const maxRevenue = Math.max(...revenueTrend.map((t) => t.wonRevenue), 1);

  return (
    <div className="space-y-6">
      {/* 4 Core Revenue KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-card border rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Won Revenue
            </span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              ${totalWonRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {wonDealsCount} {wonDealsCount === 1 ? "deal" : "deals"} closed won
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-card border rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Active Pipeline
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">
              ${totalPipelineValue.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {openDealsCount} in-progress {openDealsCount === 1 ? "deal" : "deals"}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-card border rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-purple-500" /> Deal Win Rate
            </span>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {winRate}%
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              closed won vs lost ratio
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 bg-card border rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-500" /> Avg Deal Size
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">
              ${averageDealValue.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              average revenue per win
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Revenue Charts: Trend & Pipeline Stage Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Velocity & Trend Chart */}
        <div className="lg:col-span-2 bg-card border rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Revenue Velocity & Trend
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Won revenue volume distributed over the selected timeframe
                </p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md border border-emerald-500/20">
                Closed Won Only
              </span>
            </div>

            {/* Interactive Responsive SVG Bar Chart */}
            {revenueTrend.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-muted/20 rounded-xl border border-dashed border-border">
                <DollarSign className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm font-semibold text-foreground">No Won Deals in Selected Period</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Closed won revenue will appear here as soon as deals are won.
                </p>
              </div>
            ) : (
              <div className="relative pt-6 pb-2">
                <div className="h-56 flex items-end gap-2 sm:gap-4 px-2">
                  {revenueTrend.map((item, index) => {
                    const heightPercent = Math.max(12, Math.round((item.wonRevenue / maxRevenue) * 100));
                    const isHovered = hoveredTrendIndex === index;

                    return (
                      <div
                        key={item.period}
                        className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                        onMouseEnter={() => setHoveredTrendIndex(index)}
                        onMouseLeave={() => setHoveredTrendIndex(null)}
                      >
                        {/* Tooltip Popup on Hover */}
                        {isHovered && (
                          <div className="absolute -top-12 z-20 bg-popover text-popover-foreground border px-3 py-1.5 rounded-lg shadow-lg text-xs whitespace-nowrap animate-in fade-in duration-150">
                            <div className="font-bold">${item.wonRevenue.toLocaleString()}</div>
                            <div className="text-[10px] text-muted-foreground">
                              {item.dealsCount} {item.dealsCount === 1 ? "deal" : "deals"} closed
                            </div>
                          </div>
                        )}

                        {/* Bar */}
                        <div
                          className={`w-full max-w-[48px] rounded-t-lg transition-all duration-300 ${
                            isHovered
                              ? "bg-emerald-500 shadow-md shadow-emerald-500/30 scale-y-105"
                              : "bg-emerald-500/80 hover:bg-emerald-500"
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />

                        {/* X-axis Label */}
                        <span className="text-[10px] font-medium text-muted-foreground mt-2 truncate w-full text-center">
                          {item.period}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border mt-2">
            <span>Peak Period Revenue: <strong>${maxRevenue.toLocaleString()}</strong></span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> Live Data Sync
            </span>
          </div>
        </div>

        {/* Pipeline Stage Distribution */}
        <div className="bg-card border rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Pipeline Distribution
              </h3>
              <span className="text-xs text-muted-foreground font-medium">By Stage</span>
            </div>

            <div className="space-y-3.5">
              {dealsByStage.map((stage) => (
                <div key={stage.stageId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: stage.color || (stage.isWon ? "#10b981" : stage.isLost ? "#ef4444" : "#3b82f6") }}
                      />
                      {stage.stageName}
                    </span>
                    <span className="font-bold text-foreground">
                      ${stage.totalValue.toLocaleString()}
                    </span>
                  </div>

                  {/* Progress Meter */}
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex items-center">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(4, stage.percentageOfTotal)}%`,
                        backgroundColor: stage.color || (stage.isWon ? "#10b981" : stage.isLost ? "#ef4444" : "#3b82f6"),
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{stage.count} {stage.count === 1 ? "deal" : "deals"}</span>
                    <span>{stage.percentageOfTotal}% of pipeline</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4 text-[11px] text-muted-foreground text-center">
            Progression across active sales stages
          </div>
        </div>
      </div>
    </div>
  );
};
