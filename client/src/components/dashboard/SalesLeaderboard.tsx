import React, { useState } from "react";
import { RepLeaderboardEntry, CompanyKPISummary } from "../../types/api.types";
import { Trophy, TrendingUp, DollarSign, Target, MessageSquare, CheckCircle2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SalesLeaderboardProps {
  leaderboard: RepLeaderboardEntry[];
  companyKPIs?: CompanyKPISummary;
  loading: boolean;
}

export const SalesLeaderboard: React.FC<SalesLeaderboardProps> = ({
  leaderboard,
  companyKPIs,
  loading,
}) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"wonRevenue" | "pipelineValue" | "wonDealsCount">("wonRevenue");

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === "wonRevenue") return b.wonRevenue - a.wonRevenue || b.wonDealsCount - a.wonDealsCount;
    if (sortBy === "pipelineValue") return b.pipelineValue - a.pipelineValue;
    return b.wonDealsCount - a.wonDealsCount || b.wonRevenue - a.wonRevenue;
  });

  if (loading) {
    return (
      <div className="bg-card border rounded-xl p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-6 bg-accent rounded w-1/4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-accent/40 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const getRankBadge = (index: number) => {
    const rankColors = [
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
      "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
      "bg-amber-700/10 text-amber-800 dark:text-amber-300 border-amber-700/30",
    ];
    const badgeClass = rankColors[index] || "bg-muted/70 text-muted-foreground border-border/70";
    return (
      <span className={`w-6 h-6 rounded font-mono text-[11px] font-bold flex items-center justify-center border mx-auto ${badgeClass}`}>
        #{index + 1}
      </span>
    );
  };

  return (
    <div className="bg-card border border-border/80 rounded-lg shadow-2xs overflow-hidden">
      {/* Header & KPI Summary */}
      <div className="p-4 sm:p-5 border-b border-border/70 bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-muted/70 border border-border/70 flex items-center justify-center text-foreground shrink-0">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight font-display">
                Sales Rep Performance Leaderboard
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Live rankings across closed revenue, deal flow, and responsiveness
              </p>
            </div>
          </div>

          {/* Quick Sort Options */}
          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-md text-xs self-start sm:self-auto border border-border/50">
            <button
              onClick={() => setSortBy("wonRevenue")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                sortBy === "wonRevenue"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Won Revenue
            </button>
            <button
              onClick={() => setSortBy("pipelineValue")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                sortBy === "pipelineValue"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active Pipeline
            </button>
            <button
              onClick={() => setSortBy("wonDealsCount")}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                sortBy === "wonDealsCount"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Won Deals
            </button>
          </div>
        </div>

        {/* Company Quick Glance KPIs */}
        {companyKPIs && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-3 border-t border-border/60">
            <div className="p-3 bg-muted/30 border border-border/70 rounded-md">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Won Revenue
              </div>
              <div className="text-base font-bold font-mono tabular-nums text-foreground mt-1">
                ${companyKPIs.totalWonRevenue.toLocaleString()}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                {companyKPIs.totalWonDeals} closed deals
              </div>
            </div>

            <div className="p-3 bg-muted/30 border border-border/70 rounded-md">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-foreground" /> Pipeline
              </div>
              <div className="text-base font-bold font-mono tabular-nums text-foreground mt-1">
                ${companyKPIs.totalPipelineValue.toLocaleString()}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                {companyKPIs.totalOpenDeals} open deals
              </div>
            </div>

            <div className="p-3 bg-muted/30 border border-border/70 rounded-md">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Target className="w-3 h-3 text-foreground" /> Win Rate
              </div>
              <div className="text-base font-bold font-mono tabular-nums text-foreground mt-1">
                {companyKPIs.companyWinRate}%
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                of closed deals
              </div>
            </div>

            <div className="p-3 bg-muted/30 border border-border/70 rounded-md">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Attention
              </div>
              <div className="text-base font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400 mt-1">
                {companyKPIs.overdueTasksCount} Overdue
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {companyKPIs.unassignedChatsCount} unassigned chats
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/30 text-muted-foreground text-[11px] uppercase font-semibold tracking-wider border-b border-border/70">
            <tr>
              <th className="py-2.5 px-4 w-12 text-center">Rank</th>
              <th className="py-2.5 px-4">Sales Rep</th>
              <th className="py-2.5 px-4 text-right">Won Revenue</th>
              <th className="py-2.5 px-4 text-right">Active Pipeline</th>
              <th className="py-2.5 px-4 text-center">Win Rate</th>
              <th className="py-2.5 px-4 text-center">Tasks Done</th>
              <th className="py-2.5 px-4 text-center">Active Chats</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {sortedLeaderboard.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-muted-foreground italic text-xs">
                  No active team members found.
                </td>
              </tr>
            ) : (
              sortedLeaderboard.map((rep, idx) => (
                <tr key={rep.userId} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2.5 px-4 text-center font-bold">
                    {getRankBadge(idx)}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-secondary border border-border/70 flex items-center justify-center text-foreground font-bold text-xs shrink-0">
                        {rep.avatarUrl ? (
                          <img src={rep.avatarUrl} alt={rep.name} className="w-full h-full rounded-md object-cover" />
                        ) : (
                          rep.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                          {rep.name}
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded font-medium bg-muted text-muted-foreground border border-border/60">
                            {rep.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                          {rep.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="font-bold text-foreground font-mono tabular-nums">
                      ${rep.wonRevenue.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {rep.wonDealsCount} {rep.wonDealsCount === 1 ? "deal" : "deals"} won
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="font-semibold text-foreground font-mono tabular-nums">
                      ${rep.pipelineValue.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {rep.openDealsCount} in progress
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="w-20 mx-auto">
                      <div className="flex justify-between text-[10px] font-mono font-medium text-foreground mb-1">
                        <span>{rep.winRate}%</span>
                      </div>
                      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground/70 rounded-full"
                          style={{ width: `${Math.min(100, rep.winRate)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono bg-muted/70 text-foreground border border-border/60">
                      <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
                      {rep.completedTasksCount}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono bg-muted/70 text-foreground border border-border/60">
                      <MessageSquare className="w-3 h-3 text-muted-foreground" />
                      {rep.activeChatsCount}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <button
                      onClick={() => navigate("/deals")}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground hover:text-muted-foreground transition-colors cursor-pointer"
                    >
                      Deals <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
